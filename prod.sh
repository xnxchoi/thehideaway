#!/usr/bin/env bash
# prod.sh — deploy or migrate on the production VPS.
#
# Usage:
#   ./prod.sh                  — deploy latest image
#   ./prod.sh --migrate        — back up DB, then run migrations
#   ./prod.sh --full           — deploy + run migrations
#
# Environment variables (set in shell or export before running):
#   IMAGE_TAG   — git SHA or tag to deploy (default: latest)
#   REGISTRY    — image registry prefix    (default: hideaway)
#
# First-time setup:
#   1. docker network create --ipv6=true hideaway
#   2. Copy .env.production to the VPS (never commit this file)
#   3. Run SSL cert setup, then: ./prod.sh

set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-latest}"
# Default to ghcr.io so direct `./prod.sh --migrate` calls work without the
# caller having to remember to export REGISTRY. Override for local-only builds:
# REGISTRY=hideaway ./prod.sh
REGISTRY="${REGISTRY:-ghcr.io/xnxchoi/hideaway}"
# --env-file feeds compose variable interpolation (${VAR} in compose.prod.yaml).
# The service-level env_file: directive does NOT feed this — they are separate.
COMPOSE="docker compose -f compose.prod.yaml --env-file .env.production"

# ── Helpers ───────────────────────────────────────────────────────────────────

ensure_network() {
  if ! docker network ls --format '{{.Name}}' | grep -q '^hideaway$'; then
    echo "→ Creating hideaway network..."
    docker network create --ipv6=true hideaway
  fi
}

backup_db() {
  # Dumps the DB in custom format (-Fc) to the current directory.
  # Restore with: pg_restore -d <target> <file>
  local file="backup-$(date +%Y%m%d-%H%M%S).dump"
  echo "→ Backing up database to ${file}..."
  docker compose -f compose.prod.yaml exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-postgres}" -Fc "${POSTGRES_DB:-theestate}" > "${file}"
  echo "  Backup saved: ${file}"
}

run_migrations() {
  echo "→ Pulling migrate image (tag: ${IMAGE_TAG})..."
  # Explicit pull surfaces auth/tag errors here instead of inside `run --rm`.
  IMAGE_TAG="${IMAGE_TAG}" REGISTRY="${REGISTRY}" \
    ${COMPOSE} --profile migrate pull migrate

  echo "→ Running migrations..."
  IMAGE_TAG="${IMAGE_TAG}" REGISTRY="${REGISTRY}" \
    ${COMPOSE} --profile migrate run --rm migrate
  echo "  Migrations complete."
}

deploy() {
  ensure_network

  echo "→ Pulling images (tag: ${IMAGE_TAG})..."
  IMAGE_TAG="${IMAGE_TAG}" REGISTRY="${REGISTRY}" ${COMPOSE} pull payload

  echo "→ Starting services..."
  IMAGE_TAG="${IMAGE_TAG}" REGISTRY="${REGISTRY}" ${COMPOSE} up -d --wait

  echo ""
  echo "✓ Deployed ${REGISTRY}:${IMAGE_TAG}"
}

# ── Entry point ───────────────────────────────────────────────────────────────

case "${1:-}" in
  --migrate)
    backup_db
    run_migrations
    ;;
  --full)
    deploy
    backup_db
    run_migrations
    ;;
  "")
    deploy
    ;;
  *)
    echo "Usage: $0 [--migrate | --full]"
    exit 1
    ;;
esac
