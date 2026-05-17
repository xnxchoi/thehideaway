#!/usr/bin/env bash
# scripts/redeploy.sh — pull a freshly-built image from ghcr.io and recreate
# the production stack. Runs on the VPS as the `deploy` user.
#
# Usage:
#   ./scripts/redeploy.sh                  # pull :latest, deploy, no migrate
#   ./scripts/redeploy.sh <sha-or-tag>     # pull a specific tag
#   ./scripts/redeploy.sh <tag> --migrate  # deploy + run migrations
#   ./scripts/redeploy.sh --migrate        # latest + migrations
#
# Prereqs (set once by first-deploy.sh):
#   • `docker login ghcr.io` is active for the deploy user
#     (~/.docker/config.json holds the PAT credential)
#   • .env.production exists at the repo root
#   • The `hideaway` Docker network exists
#
# What this is NOT:
#   • Not for first-deploy — use scripts/first-deploy.sh for a fresh VPS.
#   • Not a git puller for the repo itself — run `git pull` separately if you
#     also need updated compose files / scripts (rare; compose.prod.yaml moves
#     slowly compared to the image).

set -Eeuo pipefail
trap 'echo "✗ redeploy failed at line $LINENO: $BASH_COMMAND" >&2' ERR

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info() { echo -e "${GREEN}→${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }

# Defaults aligned with prod.sh / compose.prod.yaml.
REGISTRY="${REGISTRY:-ghcr.io/xnxchoi/hideaway}"
IMAGE_TAG="latest"
DO_MIGRATE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --migrate) DO_MIGRATE=true; shift ;;
    -h|--help)
      sed -n '2,/^set -Eeuo/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    --*)
      echo "Unknown flag: $1" >&2
      exit 2
      ;;
    *)
      IMAGE_TAG="$1"
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_DIR}"

if [[ ! -f .env.production ]]; then
  echo "✗ .env.production not found at $(pwd)/.env.production" >&2
  exit 1
fi

# Verify ghcr.io auth is set up. `docker pull` would fail later anyway, but
# this gives a clearer error.
if ! grep -q "ghcr.io" ~/.docker/config.json 2>/dev/null; then
  warn "~/.docker/config.json has no ghcr.io entry."
  warn "If the image is private, the pull will fail. To set up auth:"
  warn "  echo \$GHCR_PAT | docker login ghcr.io -u <github-user> --password-stdin"
fi

info "Registry:  ${BOLD}${REGISTRY}${NC}"
info "Image tag: ${BOLD}${IMAGE_TAG}${NC}"

# prod.sh handles the actual compose pull / up / migrate wiring. We just
# bridge env vars into it.
export REGISTRY IMAGE_TAG

if [[ "${DO_MIGRATE}" == true ]]; then
  info "Running prod.sh --full (deploy + migrate)..."
  ./prod.sh --full
else
  info "Running prod.sh (deploy only)..."
  ./prod.sh
fi

echo
echo -e "${GREEN}${BOLD}✓ Redeployed${NC} ${REGISTRY}:${IMAGE_TAG}"
echo
echo "Verify:"
echo "  docker compose -f compose.prod.yaml ps"
echo "  docker compose -f compose.prod.yaml logs --tail=50 payload"
