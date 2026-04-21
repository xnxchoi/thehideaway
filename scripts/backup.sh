#!/usr/bin/env bash
# scripts/backup.sh — PostgreSQL backup with retention.
#
# Usage (run on the VPS as deploy or root):
#   ./scripts/backup.sh                 — dump to /home/deploy/backups/
#   ./scripts/backup.sh /path/to/dir    — dump to a custom directory
#   KEEP=14 ./scripts/backup.sh         — keep last 14 backups (default: 7)
#
# Output file format:
#   theestate-20260421-143000.dump   (pg_dump custom format, compressed)
#
# Restore a backup:
#   docker compose -f compose.prod.yaml exec -T postgres \
#     pg_restore -U postgres -d theestate < theestate-*.dump
#
# Schedule daily backups (add to crontab -e as deploy):
#   0 2 * * * /home/deploy/thehideaway/scripts/backup.sh >> /home/deploy/backups/backup.log 2>&1

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
BACKUP_DIR="${1:-/home/deploy/backups}"
KEEP="${KEEP:-7}"
DB_NAME="${POSTGRES_DB:-theestate}"
DB_USER="${POSTGRES_USER:-postgres}"
COMPOSE_FILE="${COMPOSE_FILE:-/home/deploy/thehideaway/compose.prod.yaml}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.dump"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
info()  { echo -e "[$(date +%H:%M:%S)] ${GREEN}→${NC} $*"; }
error() { echo -e "[$(date +%H:%M:%S)] ${RED}✗${NC}  $*" >&2; }

info "Starting backup: ${DB_NAME} → ${BACKUP_FILE}"

# ── Guard: backup directory must exist ───────────────────────────────────────
if [[ ! -d "${BACKUP_DIR}" ]]; then
  error "Backup directory not found: ${BACKUP_DIR}"
  error "Run scripts/server-setup.sh first, or pass a custom path."
  exit 1
fi

# ── Guard: postgres container must be running ─────────────────────────────────
if ! docker compose -f "${COMPOSE_FILE}" ps postgres 2>/dev/null | grep -q 'running'; then
  error "Postgres container is not running. Start services first."
  exit 1
fi

# ── Dump ──────────────────────────────────────────────────────────────────────
docker compose -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U "${DB_USER}" -Fc "${DB_NAME}" > "${BACKUP_FILE}"

DUMP_SIZE="$(du -sh "${BACKUP_FILE}" | cut -f1)"
info "Backup complete — ${DUMP_SIZE} written to ${BACKUP_FILE}"

# ── Retention: remove backups older than KEEP days ────────────────────────────
info "Pruning backups older than ${KEEP} days..."
PRUNED=0
while IFS= read -r -d '' old_file; do
  rm -f "${old_file}"
  info "  Removed: $(basename "${old_file}")"
  ((PRUNED++)) || true
done < <(find "${BACKUP_DIR}" -name "${DB_NAME}-*.dump" -mtime "+${KEEP}" -print0)

if [[ "${PRUNED}" -eq 0 ]]; then
  info "  Nothing to prune"
fi

# ── Inventory ─────────────────────────────────────────────────────────────────
BACKUP_COUNT="$(find "${BACKUP_DIR}" -name "${DB_NAME}-*.dump" | wc -l)"
BACKUP_TOTAL="$(du -sh "${BACKUP_DIR}"/*.dump 2>/dev/null | awk '{sum += $1} END {print sum "K"}' || echo "n/a")"
info "Current backups: ${BACKUP_COUNT} files in ${BACKUP_DIR}"

echo ""
echo "  ✓ Backup done"
echo "    File:       ${BACKUP_FILE}"
echo "    Size:       ${DUMP_SIZE}"
echo "    Retained:   last ${KEEP} days (${BACKUP_COUNT} file(s))"
echo ""
echo "  Restore with:"
echo "    docker compose -f ${COMPOSE_FILE} exec -T postgres \\"
echo "      pg_restore -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_FILE}"
echo ""
