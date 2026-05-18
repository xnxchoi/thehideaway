#!/usr/bin/env bash
# scripts/cut-release.sh — cut a release from the laptop.
#
# Usage:
#   pnpm release:cut 1.2.3                    — tag v1.2.3 and push (triggers CI)
#   pnpm release:cut 1.2.3-rc.1               — pre-release tag (CI skips :latest)
#   pnpm release:cut --check 1.2.3            — run all gates, do NOT tag/push
#   pnpm release:cut --force 1.2.3            — skip working-tree clean check
#
# What this does:
#   1. Validate the version arg as semver (vX.Y.Z[-pre]). Accepts with or
#      without the leading `v`.
#   2. Confirm git working tree is clean (override with --force).
#   3. Confirm current branch is `main` (override with --force or
#      RELEASE_ALLOW_NON_MAIN=1).
#   4. Confirm the tag doesn't already exist locally or on origin.
#   5. Run validation gates that mirror CI exactly:
#         pnpm verify:deploy-rules
#         pnpm env:template:verify
#         pnpm env:decrypt > /tmp/x && pnpm verify:env /tmp/x
#         pnpm install --frozen-lockfile
#         pnpm build (+ standalone preflight)
#   6. Create an annotated, signed tag (if `git config user.signingkey` is set).
#   7. git push origin <tag> — triggers the release workflow.
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
VERSION=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK_ONLY=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help)
      sed -n '2,/^set -Eeuo/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*) die "unknown flag: $1" ;;
    *)
      if [[ -n "${VERSION}" ]]; then
        die "extra argument: $1"
      fi
      VERSION="$1"
      shift
      ;;
  esac
done

[[ -n "${VERSION}" ]] || die "missing version. Usage: pnpm release:cut 1.2.3"

# Normalize: accept "1.2.3" or "v1.2.3".
[[ "${VERSION}" =~ ^v ]] || VERSION="v${VERSION}"

if [[ ! "${VERSION}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  die "version is not semver: ${VERSION} (expected vMAJOR.MINOR.PATCH or vMAJOR.MINOR.PATCH-PRE)"
fi

# ── Gates ────────────────────────────────────────────────────────────────────

step "1/6  git working tree"
if [[ -n "$(git status --porcelain)" ]]; then
  if (( FORCE )); then
    warn "working tree has uncommitted changes — proceeding (--force)"
  else
    error "working tree is not clean:"
    git status --short >&2
    die "commit or stash before cutting a release (or pass --force at your own risk)"
  fi
else
  info "clean"
fi

step "2/6  branch"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${BRANCH}" != "main" ]]; then
  if (( FORCE )) || [[ "${RELEASE_ALLOW_NON_MAIN:-0}" == "1" ]]; then
    warn "on branch ${BRANCH} (not main) — proceeding"
  else
    die "on branch ${BRANCH}, not main. Use --force or set RELEASE_ALLOW_NON_MAIN=1 to override."
  fi
else
  info "on main"
fi

step "3/6  tag availability"
if git rev-parse "refs/tags/${VERSION}" >/dev/null 2>&1; then
  die "tag ${VERSION} already exists locally. Delete with: git tag -d ${VERSION}"
fi
# Best-effort check against origin; don't fail if offline.
if git ls-remote --exit-code --tags origin "${VERSION}" >/dev/null 2>&1; then
  die "tag ${VERSION} already exists on origin. Bump the version."
fi
info "tag ${VERSION} is unused"

step "4/6  manifest + template drift gates"
pnpm verify:deploy-rules
pnpm env:template:verify

step "4b/6 env schema gate (against decrypted prod env)"
TMP_ENV="$(mktemp -t hideaway-env.XXXXXX)"
trap 'rm -f "${TMP_ENV}"' EXIT
pnpm env:decrypt > "${TMP_ENV}"
pnpm verify:env "${TMP_ENV}"

step "5/6  build (verifies pnpm install + pnpm build + standalone)"
pnpm install --frozen-lockfile
pnpm build
if [[ ! -f .next/standalone/server.js || ! -d .next/static ]]; then
  die "standalone preflight failed. Confirm next.config.ts has output: \"standalone\"."
fi
info "standalone present"

if (( CHECK_ONLY )); then
  step "✓ --check complete — gates passed, no tag created"
  exit 0
fi

step "6/6  tag + push"
TAG_MSG="Release ${VERSION}

Triggered from $(git rev-parse --short HEAD) on ${BRANCH}.
"

# Sign if a signing key is configured.
SIGN_FLAG="-a"
if git config --get user.signingkey >/dev/null 2>&1; then
  SIGN_FLAG="-sa"
  info "signing tag with $(git config --get user.signingkey)"
fi

git tag "${SIGN_FLAG}" "${VERSION}" -m "${TAG_MSG}"
info "tag created locally: ${VERSION}"

info "pushing to origin..."
git push origin "${VERSION}"

REPO_SLUG="$(git config --get remote.origin.url | sed -E 's#.*github\.com[:/]([^/]+/[^/.]+).*#\1#')"
cat <<EOF

${GREEN}✓ release cut.${NC}

Watch CI:    https://github.com/${REPO_SLUG}/actions
When green:  ssh deploy@${DOMAIN:-hideawayseoul.com} 'cd thehideaway && ./scripts/deploy.sh ${VERSION}'

EOF
