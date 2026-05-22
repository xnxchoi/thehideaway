#!/usr/bin/env bash
# scripts/deploy.sh — deploy a tagged release on the production VPS.
#
# Usage:
#   ./scripts/deploy.sh v1.2.3              — deploy the runtime image
#   ./scripts/deploy.sh v1.2.3 --migrate    — same + run migrations (with backup)
#   ./scripts/deploy.sh latest              — deploy whatever :latest points at
#   ./scripts/deploy.sh --status            — print the currently deployed tag
#   ./scripts/deploy.sh --rollback          — roll back to the previous tag
#
# What this does (idempotent):
#   1. Validate the requested tag exists on ghcr.io.
#   2. Decrypt .env.production.enc via sops + age (key from /etc/age/keys.txt).
#   3. Capture the currently deployed tag (for rollback bookkeeping).
#   4. `docker compose pull` the new image.
#   5. `docker compose up -d --wait` (compose keeps the old container alive
#       until the new one passes its healthcheck).
#   6. Smoke test: GET https://${DOMAIN}/api/health -> expect 200.
#   7. On smoke-test failure, roll back to the previous tag automatically.
#   8. Persist the new tag to /var/lib/hideaway/current-tag.
#   9. With --migrate, take a pg_dump backup THEN run --profile migrate.
#
# Run as the `deploy` user, from /home/deploy/thehideaway.
#
# Replaces: prod.sh + the missing scripts/redeploy.sh.

set -Eeuo pipefail

# ── Config ───────────────────────────────────────────────────────────────────

DOMAIN="${DOMAIN:-hideawayseoul.com}"
REGISTRY="${REGISTRY:-ghcr.io/xnxchoi/hideaway}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.prod.yaml}"
ENV_ENC=".env.production.enc"
ENV_PLAIN=".env.production"
AGE_KEY_FILE="${SOPS_AGE_KEY_FILE:-/etc/age/keys.txt}"
STATE_DIR="/var/lib/hideaway"
CURRENT_TAG_FILE="${STATE_DIR}/current-tag"
PREVIOUS_TAG_FILE="${STATE_DIR}/previous-tag"
SMOKE_TIMEOUT_SECONDS=60

# ── Helpers ──────────────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; NC=''
fi
info()  { echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*" >&2; }
error() { echo -e "${RED}✗${NC} $*" >&2; }
die()   { error "$*"; exit 1; }

cleanup() {
  # Always shred the plaintext env. Trap fires on every exit path.
  if [[ -f "${ENV_PLAIN}" ]]; then
    if command -v shred >/dev/null 2>&1; then
      shred -u "${ENV_PLAIN}" 2>/dev/null || rm -f "${ENV_PLAIN}"
    else
      rm -f "${ENV_PLAIN}"
    fi
  fi
}
trap cleanup EXIT

# ── Sub-commands ─────────────────────────────────────────────────────────────

cmd_status() {
  if [[ -f "${CURRENT_TAG_FILE}" ]]; then
    info "currently deployed: $(cat "${CURRENT_TAG_FILE}")"
  else
    warn "no deploy recorded yet (${CURRENT_TAG_FILE} missing)"
  fi
  if [[ -f "${PREVIOUS_TAG_FILE}" ]]; then
    info "rollback target:    $(cat "${PREVIOUS_TAG_FILE}")"
  fi
}

cmd_rollback() {
  [[ -f "${PREVIOUS_TAG_FILE}" ]] \
    || die "no previous tag recorded at ${PREVIOUS_TAG_FILE}; cannot roll back."
  local prev current_before
  prev="$(cat "${PREVIOUS_TAG_FILE}")"
  current_before="$(cat "${CURRENT_TAG_FILE}" 2>/dev/null || echo "")"
  info "rolling back: ${current_before:-<unknown>} -> ${prev}"
  deploy_tag "${prev}" "rollback"
  # Manual rollback: swap the state files so `current` reflects what's
  # actually running. Auto-rollback (driven from inside deploy_tag on smoke
  # failure) intentionally leaves state untouched.
  if [[ -n "${current_before}" ]]; then
    ensure_state_dir
    ( umask 077; echo "${current_before}" > "${PREVIOUS_TAG_FILE}" )
    ( umask 077; echo "${prev}"           > "${CURRENT_TAG_FILE}" )
  fi
}

# ── Main deploy flow ─────────────────────────────────────────────────────────

decrypt_env() {
  [[ -f "${AGE_KEY_FILE}" ]] \
    || die "age key not found at ${AGE_KEY_FILE} (expected root:deploy 640). See readmes/DEPLOY.md."
  [[ -f "${ENV_ENC}" ]] \
    || die "${ENV_ENC} not found in $(pwd). Pull / sync the repo first."

  umask 077
  SOPS_AGE_KEY_FILE="${AGE_KEY_FILE}" \
    sops --decrypt --input-type dotenv --output-type dotenv "${ENV_ENC}" \
      > "${ENV_PLAIN}"
  chmod 600 "${ENV_PLAIN}"
  info ".env.production decrypted ($(wc -l < "${ENV_PLAIN}") lines)"
}

compose() {
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_PLAIN}" "$@"
}

ensure_state_dir() {
  if [[ ! -d "${STATE_DIR}" ]]; then
    sudo install -o "$(id -un)" -g "$(id -gn)" -m 0750 -d "${STATE_DIR}"
  fi
}

record_tag() {
  local new="$1"
  ensure_state_dir
  if [[ -f "${CURRENT_TAG_FILE}" ]]; then
    cp "${CURRENT_TAG_FILE}" "${PREVIOUS_TAG_FILE}"
    chmod 600 "${PREVIOUS_TAG_FILE}"
  fi
  ( umask 077; echo "${new}" > "${CURRENT_TAG_FILE}" )
}

smoke_test() {
  local url="https://${DOMAIN}/api/health"
  local deadline=$(( $(date +%s) + SMOKE_TIMEOUT_SECONDS ))
  local last_code=""
  info "smoke test: GET ${url} (deadline +${SMOKE_TIMEOUT_SECONDS}s wall-clock)"
  while (( $(date +%s) < deadline )); do
    last_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "${url}" || true)"
    if [[ "${last_code}" == "200" ]]; then
      info "smoke test passed (200)"
      return 0
    fi
    sleep 2
  done
  error "smoke test failed: never observed HTTP 200 within ${SMOKE_TIMEOUT_SECONDS}s (last code: ${last_code:-<none>})"
  return 1
}

deploy_tag() {
  local tag="$1"
  local reason="${2:-deploy}"  # `deploy` or `rollback`

  info "deploy: ${reason} -> ${tag}"

  # Confirm the manifest exists on ghcr.io BEFORE touching the running stack.
  # docker manifest inspect needs a `docker login` to ghcr.io already done.
  # Capture stderr so we can distinguish 404 (wrong tag) from 401/403 (auth).
  local manifest_err
  if ! manifest_err="$(docker manifest inspect "${REGISTRY}:${tag}" 2>&1 >/dev/null)"; then
    error "image ${REGISTRY}:${tag} not accessible:"
    echo "${manifest_err}" | sed 's/^/    /' >&2
    die "check the tag spelling AND ghcr.io credentials (\`docker login ghcr.io\`)."
  fi

  decrypt_env

  info "pulling ${REGISTRY}:${tag}"
  IMAGE_TAG="${tag}" REGISTRY="${REGISTRY}" compose pull payload

  info "rotating containers (compose up --wait)"
  IMAGE_TAG="${tag}" REGISTRY="${REGISTRY}" compose up -d --wait

  if ! smoke_test; then
    if [[ "${reason}" == "rollback" ]]; then
      die "rollback target ${tag} also fails the smoke test. Manual intervention required."
    fi
    if [[ -f "${CURRENT_TAG_FILE}" ]]; then
      local previous; previous="$(cat "${CURRENT_TAG_FILE}")"
      warn "auto-rolling back to ${previous}"
      deploy_tag "${previous}" "rollback"
      die "smoke test failed; rolled back to ${previous}"
    else
      die "smoke test failed and no previous tag to roll back to. Stack is in a bad state."
    fi
  fi

  # Only update the tag-state files on a forward deploy. During an auto- or
  # manual rollback, current/previous already hold the right values (current
  # was the now-failed tag, previous holds the target we're rolling back to);
  # writing during rollback would copy current→previous and end up with
  # current=previous=<rollback target>, making the next --rollback a no-op.
  if [[ "${reason}" != "rollback" ]]; then
    record_tag "${tag}"
  fi
  info "✓ deployed ${tag}"
}

run_migrations() {
  local tag="$1"
  local backup_file
  backup_file="/home/deploy/backups/pre-migrate-$(date -u +%Y%m%dT%H%M%SZ).dump"
  mkdir -p "$(dirname "${backup_file}")"

  # Source the decrypted env so POSTGRES_USER / POSTGRES_DB match the running
  # cluster (compose interpolates those into DATABASE_URI; the outer shell
  # doesn't see them otherwise).
  # shellcheck source=/dev/null
  set -a; . "${ENV_PLAIN}"; set +a

  # pg_dump authenticates over the container's local socket, which is
  # scram-sha-256 (POSTGRES_INITDB_ARGS --auth-local). It reads the password
  # from PGPASSWORD — run it via `sh -c` so PGPASSWORD is set from the
  # container's own POSTGRES_PASSWORD (env_file), keeping the secret inside
  # the container rather than passing it through `compose exec -e`.
  info "pre-migration backup -> ${backup_file}"
  compose exec -T postgres sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "${POSTGRES_USER:-postgres}" -Fc "${POSTGRES_DB:-theestate}"' \
    > "${backup_file}"
  info "✓ backup complete ($(du -h "${backup_file}" | awk '{print $1}'))"

  # compose.prod.yaml's migrate service already appends `-migrate` to REGISTRY
  # to resolve the image name (e.g. ghcr.io/xnxchoi/hideaway -> hideaway-migrate).
  # Just pass REGISTRY through unchanged.
  info "running migrations (image: ${REGISTRY}-migrate:${tag})"
  IMAGE_TAG="${tag}" REGISTRY="${REGISTRY}" \
    compose --profile migrate run --rm migrate
  info "✓ migrations applied"
}

# ── Entrypoint ───────────────────────────────────────────────────────────────

usage() {
  sed -n '2,/^set -Eeuo/p' "$0" | sed 's/^# \{0,1\}//'
}

main() {
  if [[ $# -eq 0 ]]; then
    usage
    exit 2
  fi

  case "$1" in
    -h|--help)  usage; exit 0 ;;
    --status)   cmd_status; exit 0 ;;
    --rollback) cmd_rollback; exit 0 ;;
  esac

  local TAG="$1"; shift
  local MIGRATE=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --migrate) MIGRATE=1; shift ;;
      *) die "unknown argument: $1" ;;
    esac
  done

  # Tag format: v1.2.3 (with optional -prerelease suffix) or the literal
  # "latest". Reject everything else to avoid pulling a malformed reference.
  if [[ "${TAG}" != "latest" && ! "${TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
    die "invalid tag: ${TAG} (expected vMAJOR.MINOR.PATCH or 'latest')"
  fi

  deploy_tag "${TAG}" "deploy"

  if (( MIGRATE )); then
    run_migrations "${TAG}"
  fi
}

main "$@"
