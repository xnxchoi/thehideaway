#!/usr/bin/env bash
# scripts/sync-from-main.sh — merge `main` into `deploy` and push.
#
# Run this from your laptop in the thehideaway clone. It's the "accept
# updates from active development into the deployable branch" button.
#
# Flow:
#   1. Save your current branch.
#   2. Update local main from origin.
#   3. Check out deploy, fast-forward from origin.
#   4. Merge main into deploy (no-ff, so the merge is a visible event).
#   5. Push deploy to origin — this triggers the GitHub Actions build.
#   6. Return you to your original branch.
#
# Conflicts: the only file expected to diverge between main and deploy is
# .dockerignore (and possibly next.config / tsconfig if you extend the
# exclusion mechanism there). If merge hits a conflict, the script stops
# and leaves you on `deploy` to resolve manually. After resolving:
#   git add <files>
#   git commit
#   git push origin deploy
#
# Usage:
#   ./scripts/sync-from-main.sh              # interactive (confirms before push)
#   ./scripts/sync-from-main.sh --yes        # non-interactive
#   ./scripts/sync-from-main.sh --no-push    # merge but don't push
#
# Safety: refuses to run if the working tree is dirty.

set -Eeuo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'
info() { echo -e "${GREEN}→${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
fail() { echo -e "${RED}✗${NC}  $*" >&2; exit 1; }

ASSUME_YES=false
DO_PUSH=true
SOURCE_BRANCH="main"
TARGET_BRANCH="deploy"
REMOTE="origin"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y)      ASSUME_YES=true; shift ;;
    --no-push)     DO_PUSH=false; shift ;;
    --source)      SOURCE_BRANCH="$2"; shift 2 ;;
    --target)      TARGET_BRANCH="$2"; shift 2 ;;
    --remote)      REMOTE="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,/^set -Eeuo/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

# Must be inside a git repo.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || fail "Not inside a git repository."

# Refuse to run on a dirty tree — keeps the merge clean and reversible.
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree is dirty. Commit or stash first."
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
info "Current branch: ${CURRENT_BRANCH}"
info "Syncing: ${BOLD}${SOURCE_BRANCH} → ${TARGET_BRANCH}${NC} (remote: ${REMOTE})"

# Make sure both refs exist on the remote.
git fetch "${REMOTE}" --prune

if ! git show-ref --verify --quiet "refs/remotes/${REMOTE}/${SOURCE_BRANCH}"; then
  fail "${REMOTE}/${SOURCE_BRANCH} doesn't exist."
fi
if ! git show-ref --verify --quiet "refs/remotes/${REMOTE}/${TARGET_BRANCH}"; then
  fail "${REMOTE}/${TARGET_BRANCH} doesn't exist. Create it first: git push -u ${REMOTE} ${TARGET_BRANCH}"
fi

# Bring local source up to date. `git fetch <remote> <branch>:<branch>` fails
# when the destination branch is currently checked out, so we use update-ref
# directly — works regardless of which branch the operator is on.
if git show-ref --verify --quiet "refs/heads/${SOURCE_BRANCH}"; then
  info "Fast-forwarding local ${SOURCE_BRANCH} to ${REMOTE}/${SOURCE_BRANCH}..."
  if [[ "${CURRENT_BRANCH}" == "${SOURCE_BRANCH}" ]]; then
    # We're on it — a normal pull is the safe fast-forward path.
    git pull --ff-only "${REMOTE}" "${SOURCE_BRANCH}"
  else
    git update-ref "refs/heads/${SOURCE_BRANCH}" "refs/remotes/${REMOTE}/${SOURCE_BRANCH}"
  fi
fi

# Check out target.
info "Checking out ${TARGET_BRANCH}..."
git checkout "${TARGET_BRANCH}"
git pull --ff-only "${REMOTE}" "${TARGET_BRANCH}"

# Show what's about to come in.
PENDING="$(git log --oneline "${TARGET_BRANCH}..${REMOTE}/${SOURCE_BRANCH}" || true)"
if [[ -z "${PENDING}" ]]; then
  info "${TARGET_BRANCH} is already up to date with ${SOURCE_BRANCH}. Nothing to do."
  git checkout "${CURRENT_BRANCH}" >/dev/null 2>&1 || true
  exit 0
fi

echo
echo -e "${BOLD}Commits to be merged from ${SOURCE_BRANCH}:${NC}"
echo "${PENDING}" | sed 's/^/  /'
echo

if [[ "${ASSUME_YES}" != true ]]; then
  read -r -p "Merge and push? [y/N] " reply
  case "${reply}" in
    y|Y|yes) : ;;
    *) info "Aborted. Returning to ${CURRENT_BRANCH}."; git checkout "${CURRENT_BRANCH}"; exit 0 ;;
  esac
fi

# Merge. --no-ff makes the merge commit visible in history, which makes
# "we shipped these upstream changes on this date" easy to read.
MERGE_MSG="Merge ${SOURCE_BRANCH} into ${TARGET_BRANCH}"
if ! git merge --no-ff -m "${MERGE_MSG}" "${REMOTE}/${SOURCE_BRANCH}"; then
  warn "Merge conflict. Resolve, then:"
  warn "  git add <files>"
  warn "  git commit"
  warn "  git push ${REMOTE} ${TARGET_BRANCH}   # triggers build"
  warn "You are currently on ${TARGET_BRANCH}."
  exit 2
fi

if [[ "${DO_PUSH}" == true ]]; then
  info "Pushing ${TARGET_BRANCH} to ${REMOTE} (this triggers the build)..."
  git push "${REMOTE}" "${TARGET_BRANCH}"
  info "Build started. Watch progress:"
  REPO_SLUG=$(git config --get "remote.${REMOTE}.url" | sed -E 's#^(https?://github\.com/|git@github\.com:)([^/]+/[^/.]+).*#\2#')
  echo "  https://github.com/${REPO_SLUG}/actions"
else
  warn "Skipped push (--no-push). Run \`git push ${REMOTE} ${TARGET_BRANCH}\` when ready."
fi

info "Returning to ${CURRENT_BRANCH}..."
git checkout "${CURRENT_BRANCH}" >/dev/null 2>&1 || true
echo
echo -e "${GREEN}${BOLD}✓ Sync complete.${NC}"
