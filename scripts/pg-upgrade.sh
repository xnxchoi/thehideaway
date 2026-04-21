#!/usr/bin/env bash
# scripts/pg-upgrade.sh — PostgreSQL major version upgrade procedure.
#
# PostgreSQL major version upgrades (e.g. 18 → 19) CANNOT be done by
# swapping the image tag. The on-disk data format changes between majors.
# This script performs a logical dump/restore upgrade.
#
# When to run this:
#   - When bumping postgres image from 18-alpine to 19-alpine (or later).
#   - NOT needed for minor/patch updates (18.0 → 18.1 is a tag swap).
#
# Before running:
#   1. Test this procedure on a staging copy first.
#   2. Schedule a maintenance window — the app will be down during upgrade.
#   3. Ensure you have enough disk space for a full DB dump (check: df -h).
#
# Usage:
#   OLD_VERSION=18 NEW_VERSION=19 ./scripts/pg-upgrade.sh
#
# The script will:
#   1. Stop the application (not the DB)
#   2. Dump the database in plain SQL format
#   3. Stop the old postgres container and rename its volume
#   4. Start a fresh postgres container with the new version
#   5. Restore the dump
#   6. Restart the application
#   7. Run migrations (schema changes introduced with the new app version)

set -euo pipefail

OLD_VERSION="${OLD_VERSION:-18}"
NEW_VERSION="${NEW_VERSION:?NEW_VERSION is required (e.g. NEW_VERSION=19)}"
COMPOSE="docker compose -f compose.prod.yaml"
DB_NAME="${POSTGRES_DB:-theestate}"
DB_USER="${POSTGRES_USER:-postgres}"
DUMP_FILE="pg-upgrade-${OLD_VERSION}-to-${NEW_VERSION}-$(date +%Y%m%d-%H%M%S).sql"

echo ""
echo "  PostgreSQL major upgrade: ${OLD_VERSION} → ${NEW_VERSION}"
echo "  Database: ${DB_NAME}"
echo "  Dump file: ${DUMP_FILE}"
echo ""
read -rp "  Proceed? This will stop the application. [y/N] " CONFIRM
[[ "${CONFIRM}" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

# ── 1. Stop app, keep postgres running ────────────────────────────────────────
echo "→ Stopping application (keeping postgres up)..."
${COMPOSE} stop payload nginx

# ── 2. Dump ───────────────────────────────────────────────────────────────────
echo "→ Dumping database to ${DUMP_FILE}..."
${COMPOSE} exec -T postgres \
  pg_dump -U "${DB_USER}" --clean --if-exists "${DB_NAME}" > "${DUMP_FILE}"
echo "  Dump size: $(du -sh "${DUMP_FILE}" | cut -f1)"

# ── 3. Stop and archive the old postgres volume ───────────────────────────────
echo "→ Stopping postgres ${OLD_VERSION}..."
${COMPOSE} stop postgres

echo "→ Renaming old data volume (keeping it as backup)..."
docker volume create "pgdata-v${OLD_VERSION}-backup-$(date +%Y%m%d)" || true
# Copy old volume contents to backup volume
docker run --rm \
  -v "theestate_pgdata:/from:ro" \
  -v "theestate_pgdata-v${OLD_VERSION}-backup-$(date +%Y%m%d):/to" \
  alpine sh -c "cp -a /from/. /to/"

# Remove old data volume so postgres can init fresh
docker volume rm theestate_pgdata

# ── 4. Update compose image and start fresh postgres ──────────────────────────
echo ""
echo "  Update compose.prod.yaml: change postgres:${OLD_VERSION}-alpine → postgres:${NEW_VERSION}-alpine"
echo "  Then press Enter to continue..."
read -r

echo "→ Starting postgres ${NEW_VERSION} with empty data volume..."
${COMPOSE} up -d postgres
${COMPOSE} exec postgres sh -c "until pg_isready -U ${DB_USER}; do sleep 1; done"

# ── 5. Restore ────────────────────────────────────────────────────────────────
echo "→ Restoring database..."
${COMPOSE} exec -T postgres psql -U "${DB_USER}" -d postgres < "${DUMP_FILE}"
echo "  Restore complete."

# ── 6. Restart application ────────────────────────────────────────────────────
echo "→ Starting application..."
${COMPOSE} up -d payload nginx

# ── 7. Migrations ─────────────────────────────────────────────────────────────
echo "→ Running migrations..."
${COMPOSE} --profile migrate run --rm migrate

echo ""
echo "✓ Upgrade complete: PostgreSQL ${OLD_VERSION} → ${NEW_VERSION}"
echo ""
echo "  Backup volume: theestate_pgdata-v${OLD_VERSION}-backup-*"
echo "  Dump file:     ${DUMP_FILE}"
echo ""
echo "  Once you have verified the application works correctly, you can"
echo "  remove the backup volume and dump file to reclaim disk space:"
echo "    docker volume rm theestate_pgdata-v${OLD_VERSION}-backup-*"
echo "    rm ${DUMP_FILE}"
