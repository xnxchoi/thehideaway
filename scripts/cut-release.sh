#!/usr/bin/env bash
# scripts/cut-release.sh — cut a release from the laptop.
#
# Usage:
#   pnpm release:cut                         — next patch after latest semver tag
#   pnpm release:cut patch|minor|major       — explicit auto-increment target
#   pnpm release:cut 1.2.3                   — exact version tag (v1.2.3)
#   pnpm release:cut 1.2.3-rc.1              — pre-release tag (CI skips :latest)
#   pnpm release:cut --check [target]        — run gates, do NOT sync/tag/push
#   pnpm release:cut --force [target]        — skip clean/main guards
#   pnpm release:cut --ship [target]         — after tagging, watch CI → deploy
#                                              to prod (auto --migrate if there
#                                              are new migrations) → live-check
#
# --ship env overrides: DEPLOY_HOST (deploy@hideawayseoul.com), DEPLOY_DIR
#   (thehideaway), DEPLOY_DOMAIN, DEPLOY_LOST_DOMAIN. Needs gh (authed) + SSH
#   access to the VPS. deploy.sh auto-rolls-back on a failed smoke test.
#
# What this does:
#   1. Read origin tags and plan the release version. By default, the next
#      version is the next patch after the highest stable semver tag on origin.
#   2. Confirm git working tree is clean (override with --force; --check warns).
#   3. Confirm current branch is `main` and not behind origin (override with --force or
#      RELEASE_ALLOW_NON_MAIN=1).
#   4. Confirm the planned tag doesn't already exist locally or on origin.
#   5. Run validation gates that mirror CI:
#         pnpm verify:deploy-rules
#         pnpm env:template:verify
#         pnpm env:decrypt > /tmp/x && pnpm verify:env /tmp/x
#         pnpm install --frozen-lockfile
#         pnpm build (+ standalone preflight)
#   6. Sync package.json's version to the planned release and commit it.
#   7. Create an annotated, signed tag (if `git config user.signingkey` is set).
#   8. Push main + tag atomically — the tag triggers the release workflow.
#
# After this completes, watch CI. When green, SSH to the VPS and run:
#   ./scripts/deploy.sh v1.2.3 [--migrate]

set -Eeuo pipefail

# ── Helpers ──────────────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; NC=''
fi
info()  { echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*" >&2; }
error() { echo -e "${RED}✗${NC} $*" >&2; }
die()   { error "$*"; exit 1; }
step()  { echo -e "\n${CYAN}── $* ──${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_DIR}"

# ── Args ─────────────────────────────────────────────────────────────────────

CHECK_ONLY=0
FORCE=0
SHIP=0
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-hideawayseoul.com}"
DEPLOY_LOST_DOMAIN="${DEPLOY_LOST_DOMAIN:-lostinseoul.com}"
DEPLOY_HOST="${DEPLOY_HOST:-deploy@hideawayseoul.com}"
DEPLOY_DIR="${DEPLOY_DIR:-thehideaway}"
VERSION=""
BUMP="patch"

set_bump() {
  case "$1" in
    major|minor|patch) BUMP="$1" ;;
    *) die "invalid bump: $1 (expected major, minor, or patch)" ;;
  esac
}

set_version() {
  if [[ -n "${VERSION}" ]]; then
    die "extra version argument: $1"
  fi
  VERSION="$1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK_ONLY=1; shift ;;
    --force) FORCE=1; shift ;;
    --ship) SHIP=1; shift ;;
    --major) set_bump "major"; shift ;;
    --minor) set_bump "minor"; shift ;;
    --patch) set_bump "patch"; shift ;;
    --bump)
      [[ $# -ge 2 ]] || die "--bump requires major, minor, or patch"
      set_bump "$2"
      shift 2
      ;;
    --version)
      [[ $# -ge 2 ]] || die "--version requires a semver value"
      set_version "$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,/^set -Eeuo/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*) die "unknown flag: $1" ;;
    *)
      case "$1" in
        major|minor|patch) set_bump "$1" ;;
        *) set_version "$1" ;;
      esac
      shift
      ;;
  esac
done

if (( CHECK_ONLY && SHIP )); then
  die "--ship cannot be combined with --check (nothing is tagged in check mode)"
fi

# ── Ship (opt-in): watch CI, then deploy to prod, then live-check ─────────────

ship_release() {
  local tag="$1"
  step "ship  CI → deploy → live check"

  command -v gh >/dev/null 2>&1 \
    || die "ship: gh CLI not found (needed to watch CI). Deploy manually: ssh ${DEPLOY_HOST} 'cd ${DEPLOY_DIR} && ./scripts/deploy.sh ${tag}'"
  gh auth status >/dev/null 2>&1 \
    || die "ship: gh not authenticated (run: gh auth login)"

  # The tag push may take a moment to register a workflow run; retry to find it.
  info "locating the release CI run for ${tag}…"
  local run_id="" attempt
  for attempt in $(seq 1 12); do
    run_id="$(gh run list --limit 20 --json databaseId,headBranch \
      --jq "[.[] | select(.headBranch==\"${tag}\")][0].databaseId" 2>/dev/null || true)"
    [[ -n "${run_id}" && "${run_id}" != "null" ]] && break
    sleep 5
  done
  [[ -n "${run_id}" && "${run_id}" != "null" ]] \
    || die "ship: no CI run found for ${tag}. Check gh run list, then deploy manually."

  info "watching CI run ${run_id} (Ctrl-C is safe — the tag is already pushed)…"
  gh run watch "${run_id}" --exit-status --interval 20 \
    || die "ship: CI failed for ${tag}; NOT deploying. Inspect: gh run view ${run_id} --log-failed"
  info "CI green for ${tag}"

  # Decide --migrate by diffing migrations between the deployed tag and this one.
  local current="" migrate_flag=""
  current="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${DEPLOY_HOST}" \
    "cd ${DEPLOY_DIR} && ./scripts/deploy.sh --status" 2>/dev/null \
    | sed -n 's/.*currently deployed: \(v[0-9][0-9.]*\).*/\1/p' | head -1 || true)"
  if [[ -n "${current}" ]] \
    && ! git diff --quiet "${current}" "${tag}" -- src/lib/migrations/ 2>/dev/null; then
    migrate_flag="--migrate"
    info "new migrations since ${current} → deploying with --migrate (pg_dump backup runs first)"
  else
    info "no new migrations since ${current:-<unknown>} → deploying without --migrate"
  fi

  info "deploying ${tag} on ${DEPLOY_HOST}…"
  ssh -o BatchMode=yes -o ConnectTimeout=20 "${DEPLOY_HOST}" \
    "cd ${DEPLOY_DIR} && ./scripts/deploy.sh ${tag} ${migrate_flag}" \
    || die "ship: remote deploy failed. deploy.sh auto-rolls-back on a failed healthcheck/smoke test; verify with: ssh ${DEPLOY_HOST} 'cd ${DEPLOY_DIR} && ./scripts/deploy.sh --status'"

  # deploy.sh already smoke-tests internally; re-verify from here as an outside observer.
  info "external live check…"
  local url code ok=1
  for url in "https://${DEPLOY_DOMAIN}/api/health" "https://${DEPLOY_LOST_DOMAIN}/api/health"; do
    code="$(curl -Ls -o /dev/null -w '%{http_code}' --max-time 15 "${url}" || true)"
    if [[ "${code}" == "200" ]]; then info "  ${url} → 200"; else error "  ${url} → ${code:-no-response}"; ok=0; fi
  done
  (( ok )) || die "ship: external live check failed after deploy — investigate immediately (consider --rollback)"
  info "✓ shipped ${tag} — live on ${DEPLOY_DOMAIN} and ${DEPLOY_LOST_DOMAIN}"
}

# ── Gates ────────────────────────────────────────────────────────────────────

step "1/8  release version"
TAG_SOURCE="origin"
LS_REMOTE_OUTPUT=""
if LS_REMOTE_OUTPUT="$(git ls-remote --tags origin 2>&1)"; then
  TAG_LIST="$(printf '%s\n' "${LS_REMOTE_OUTPUT}" | awk '{print $2}')"
  info "read tags from origin"
else
  if (( CHECK_ONLY )); then
    warn "could not read tags from origin — planning from local tags only"
    TAG_SOURCE="local"
  else
    error "${LS_REMOTE_OUTPUT}"
    die "could not read tags from origin; refusing to derive a release from stale tag state"
  fi
fi

if [[ "${TAG_SOURCE}" == "local" ]]; then
  TAG_LIST="$(git tag -l)"
fi

PLAN_ARGS=(plan --package package.json --bump "${BUMP}")
if [[ -n "${VERSION}" ]]; then
  PLAN_ARGS+=(--version "${VERSION}")
fi

PLAN_OUTPUT="$(printf '%s\n' "${TAG_LIST}" | node --no-warnings --experimental-strip-types scripts/release-version.ts "${PLAN_ARGS[@]}")" \
  || die "could not plan release version"
eval "${PLAN_OUTPUT}"

VERSION="${RELEASE_VERSION}"
PACKAGE_VERSION="${RELEASE_PACKAGE_VERSION}"

info "latest release tag: ${RELEASE_LATEST_TAG:-<none>}"
info "package.json version: ${RELEASE_PACKAGE_CURRENT}"
info "planned release: ${VERSION} (${RELEASE_VERSION_SOURCE})"
if [[ "${RELEASE_PACKAGE_DRIFT_FROM_LATEST}" == "true" ]]; then
  warn "package.json version (${RELEASE_PACKAGE_CURRENT}) differs from latest tag (${RELEASE_LATEST_TAG})"
fi

step "2/8  git working tree"
if [[ -n "$(git status --porcelain)" ]]; then
  if (( CHECK_ONLY )); then
    warn "working tree has uncommitted changes — --check is read-only, continuing"
    git status --short >&2
  elif (( FORCE )); then
    warn "working tree has uncommitted changes — proceeding (--force)"
  else
    error "working tree is not clean:"
    git status --short >&2
    die "commit or stash before cutting a release (or pass --force at your own risk)"
  fi
else
  info "clean"
fi

step "3/8  branch"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if ! (( CHECK_ONLY )); then
  git fetch --no-tags origin >/dev/null 2>&1 \
    || die "could not refresh origin branch refs; refusing to cut a release"
fi
if [[ "${BRANCH}" != "main" ]]; then
  if (( CHECK_ONLY )); then
    warn "on branch ${BRANCH} (not main) — --check is read-only, continuing"
  elif (( FORCE )) || [[ "${RELEASE_ALLOW_NON_MAIN:-0}" == "1" ]]; then
    warn "on branch ${BRANCH} (not main) — proceeding"
  else
    die "on branch ${BRANCH}, not main. Use --force or set RELEASE_ALLOW_NON_MAIN=1 to override."
  fi
else
  info "on main"
fi

UPSTREAM=""
if UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"; then
  read -r AHEAD BEHIND <<< "$(git rev-list --left-right --count "HEAD...${UPSTREAM}")"
  if [[ "${BEHIND}" != "0" ]]; then
    if (( CHECK_ONLY )); then
      warn "${BRANCH} is behind ${UPSTREAM} by ${BEHIND} commit(s)"
    elif (( FORCE )); then
      warn "${BRANCH} is behind ${UPSTREAM} by ${BEHIND} commit(s) — proceeding (--force)"
    else
      die "${BRANCH} is behind ${UPSTREAM} by ${BEHIND} commit(s). Pull/rebase before cutting a release."
    fi
  else
    info "${BRANCH} is not behind ${UPSTREAM} (ahead ${AHEAD})"
  fi
else
  warn "no upstream configured for ${BRANCH}; cannot check branch freshness"
fi

remote_tag_exists() {
  local tag="$1"
  # Capture git's real exit code directly. Do NOT read $? after an
  # `if git …; then …; fi` — a false `if` with no `else` resets $? to 0,
  # so the absent-tag case (exit 2) was always mis-read as an error and died.
  # `|| status=$?` also shields the call from `set -e`.
  local status=0
  git ls-remote --exit-code --tags origin "${tag}" >/dev/null 2>&1 || status=$?

  if [[ "${status}" == "0" ]]; then
    return 0
  fi
  if [[ "${status}" == "2" ]]; then
    return 1
  fi

  die "could not check origin for tag ${tag}; refusing to continue"
}

step "4/8  tag availability"
if git rev-parse "refs/tags/${VERSION}" >/dev/null 2>&1; then
  die "tag ${VERSION} already exists locally. Delete with: git tag -d ${VERSION}"
fi
if remote_tag_exists "${VERSION}"; then
  die "tag ${VERSION} already exists on origin. Bump the version."
fi
info "tag ${VERSION} is unused"

step "5/8  manifest + template drift gates"
pnpm verify:deploy-rules
pnpm env:template:verify

step "5b/8 env schema gate (against decrypted prod env)"
TMP_ENV="$(mktemp -t hideaway-env.XXXXXX)"
trap 'rm -f "${TMP_ENV}"' EXIT
pnpm env:decrypt > "${TMP_ENV}"
pnpm verify:env "${TMP_ENV}"

step "6/8  build (verifies pnpm install + pnpm build + standalone)"
pnpm install --frozen-lockfile
pnpm build
if [[ ! -f .next/standalone/server.js || ! -d .next/static ]]; then
  die "standalone preflight failed. Confirm next.config.ts has output: \"standalone\"."
fi
info "standalone present"

if (( CHECK_ONLY )); then
  step "✓ --check complete — gates passed, no package sync, no tag created"
  exit 0
fi

step "7/8  package version sync"
if [[ "${RELEASE_PACKAGE_NEEDS_SYNC}" == "true" ]]; then
  if ! git diff --cached --quiet; then
    die "index has staged changes; unstage them before release so the package-version commit stays isolated"
  fi

  node --no-warnings --experimental-strip-types scripts/release-version.ts \
    sync --package package.json --version "${VERSION}"
  git add package.json pnpm-lock.yaml

  if git diff --cached --quiet -- package.json pnpm-lock.yaml; then
    info "package metadata already synced"
  else
    git commit -m "chore(release): ${VERSION}"
    info "package.json synced to ${PACKAGE_VERSION}"
  fi
else
  info "package.json already at ${PACKAGE_VERSION}"
fi

step "8/8  tag + push"
if remote_tag_exists "${VERSION}"; then
  die "tag ${VERSION} appeared on origin during validation. Bump/retry."
fi

TAG_MSG="Release ${VERSION}

Triggered from $(git rev-parse --short HEAD) on ${BRANCH}.
Package version: ${PACKAGE_VERSION}.
"

# Sign if a signing key is configured.
SIGN_FLAG="-a"
if git config --get user.signingkey >/dev/null 2>&1; then
  SIGN_FLAG="-sa"
  info "signing tag with $(git config --get user.signingkey)"
fi

git tag "${SIGN_FLAG}" "${VERSION}" -m "${TAG_MSG}"
info "tag created locally: ${VERSION}"

if [[ "${BRANCH}" == "main" ]]; then
  info "pushing ${BRANCH} + ${VERSION} to origin atomically..."
  git push --atomic origin "${BRANCH}" "${VERSION}"
else
  warn "not on main; pushing tag only"
  git push origin "${VERSION}"
fi

REPO_SLUG="$(git config --get remote.origin.url | sed -E 's#.*github\.com[:/]([^/]+/[^/.]+).*#\1#')"
cat <<EOF

${GREEN}✓ release cut.${NC}

Version:     ${VERSION}
Package:     package.json -> ${PACKAGE_VERSION}
Watch CI:    https://github.com/${REPO_SLUG}/actions
When green:  ssh ${DEPLOY_HOST} 'cd ${DEPLOY_DIR} && ./scripts/deploy.sh ${VERSION}'

EOF

if (( SHIP )); then
  ship_release "${VERSION}"
fi
