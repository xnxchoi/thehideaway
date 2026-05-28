#!/usr/bin/env bash
# scripts/sync-repo-to-vps.sh — rsync the working repo to a VPS, excluding
# everything listed in .deployignore.
#
# Used by LAUNCH.md Step 3 to bootstrap /root/thehideaway on a fresh VPS so
# the wrapper scripts (first-deploy.sh, etc.) are available before GitHub
# auth is configured for the deploy user.
#
# Usage:
#   bash scripts/sync-repo-to-vps.sh root@rp.hideawayseoul.com
#   bash scripts/sync-repo-to-vps.sh root@rp.hideawayseoul.com:/root/thehideaway/
#   bash scripts/sync-repo-to-vps.sh --dry-run root@rp.hideawayseoul.com
#
# If no path is supplied, defaults to /root/thehideaway/ on the target host.
# Pass --dry-run to preview without copying.
#
# Edit .deployignore to change what's excluded. The list is intentionally
# separate from .dockerignore — they're different concerns even when the
# patterns overlap.

set -Eeuo pipefail

DRY_RUN=""
TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-n) DRY_RUN="--dry-run"; shift ;;
    -h|--help)
      sed -n '2,/^set -Eeuo/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      if [[ -n "${TARGET}" ]]; then
        echo "✗ Unexpected extra argument: $1" >&2
        exit 2
      fi
      TARGET="$1"
      shift
      ;;
  esac
done

if [[ -z "${TARGET}" ]]; then
  echo "✗ Usage: $0 [--dry-run] user@host[:/path]" >&2
  exit 2
fi

# Append default path if the operator only gave user@host.
if [[ "${TARGET}" != *:* ]]; then
  TARGET="${TARGET}:/root/thehideaway/"
elif [[ "${TARGET}" == *: ]]; then
  TARGET="${TARGET}/root/thehideaway/"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
IGNORE_FILE="${REPO_DIR}/.deployignore"

if [[ ! -f "${IGNORE_FILE}" ]]; then
  echo "✗ .deployignore not found at ${IGNORE_FILE}" >&2
  echo "  Create one at the repo root with your exclude patterns." >&2
  exit 1
fi

echo "→ Source: ${REPO_DIR}"
echo "→ Target: ${TARGET}"
echo "→ Excludes: ${IGNORE_FILE}"
[[ -n "${DRY_RUN}" ]] && echo "→ Mode: DRY RUN (no files copied)"
echo

rsync -av --progress ${DRY_RUN} \
  --exclude-from="${IGNORE_FILE}" \
  "${REPO_DIR}/" "${TARGET}"

echo
echo "✓ Sync complete."
echo "Verify on the VPS:"
host_part="${TARGET%%:*}"
echo "  ssh ${host_part} 'du -sh ${TARGET#*:} && ls ${TARGET#*:}scripts/first-deploy.sh'"
-