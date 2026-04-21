#!/usr/bin/env bash
# scripts/cron-setup.sh
#
# Installs production cron jobs for the deploy user.
# Run once after first deploy (or re-run idempotently to reset/update).
#
# Usage (run as deploy user):
#   bash scripts/cron-setup.sh
#
# What gets installed (as the deploy user):
#   17:00 UTC daily  — DB backup        (scripts/backup.sh)    → 02:00 KST
#   23:00 UTC daily  — Disk usage check (scripts/disk-check.sh)→ 08:00 KST
#
# NOTE: TLS cert renewal is installed by scripts/server-setup.sh as root.
#       It runs at 03:00 UTC daily (root crontab). Do not duplicate it here.
#
# All output is appended to /var/log/thehideaway-cron.log.
# Errors are also mailed to the cron owner if a local MTA is configured.

set -euo pipefail

APP_DIR="${APP_DIR:-/home/deploy/thehideaway}"
LOG_FILE="/var/log/thehideaway-cron.log"
CRON_MARKER="# thehideaway-managed"

# ── Helpers ───────────────────────────────────────────────────────────────────

log() { echo "[cron-setup] $*"; }

die() { echo "[cron-setup] ERROR: $*" >&2; exit 1; }

# Verify required scripts exist before registering the crons.
check_scripts() {
  local missing=0
  for script in backup.sh disk-check.sh; do
    if [[ ! -f "${APP_DIR}/scripts/${script}" ]]; then
      log "WARNING: ${APP_DIR}/scripts/${script} not found — check APP_DIR"
      missing=1
    fi
  done
  if [[ $missing -eq 1 ]]; then
    die "One or more scripts missing. Set APP_DIR to the repo root and retry."
  fi
}

# Ensure the log file exists and is writable by the deploy user.
# /var/log/ requires root to create; fall back to ~/logs/ gracefully.
ensure_log_file() {
  if [[ ! -f "$LOG_FILE" ]]; then
    touch "$LOG_FILE" 2>/dev/null || {
      local fallback="${HOME}/logs/thehideaway-cron.log"
      log "Cannot create $LOG_FILE — needs root (touch $LOG_FILE && chown $(whoami) $LOG_FILE)"
      mkdir -p "$(dirname "$fallback")"
      touch "$fallback"
      LOG_FILE="$fallback"
      log "Falling back to $LOG_FILE"
    }
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────

check_scripts
ensure_log_file

# Build the crontab block we want installed.
# Times are UTC (server default). KST = UTC+9.
read -r -d '' CRON_BLOCK << CRONTAB || true
${CRON_MARKER} — DO NOT EDIT this block manually; re-run cron-setup.sh to update.
MAILTO=""

# Daily DB backup — 17:00 UTC = 02:00 KST.
# Keeps last 7 days by default (configurable via BACKUP_RETAIN_DAYS in backup.sh).
0 17 * * * cd ${APP_DIR} && bash scripts/backup.sh >> ${LOG_FILE} 2>&1

# Daily disk usage report — 23:00 UTC = 08:00 KST.
# Exits 1 and logs a warning when usage crosses 80% (critical at 90%).
0 23 * * * cd ${APP_DIR} && bash scripts/disk-check.sh >> ${LOG_FILE} 2>&1

${CRON_MARKER} — END
CRONTAB

# Strip any existing managed block from the current crontab, then append the
# new block. Idempotent — safe to re-run.
EXISTING=$(crontab -l 2>/dev/null || true)
STRIPPED=$(echo "$EXISTING" | sed "/^${CRON_MARKER}/,/^${CRON_MARKER} — END/d")

# Collapse trailing blank lines from the stripped block, then append new block.
NEW_CRONTAB=$(printf '%s\n\n%s\n' "$(echo "$STRIPPED" | sed '/^[[:space:]]*$/d')" "$CRON_BLOCK")

echo "$NEW_CRONTAB" | crontab -

log "Cron jobs installed. Verify with: crontab -l"
log "Logs will be written to: ${LOG_FILE}"
log ""
log "Installed jobs (deploy user):"
log "  17:00 UTC (02:00 KST) — DB backup       (backup.sh)"
log "  23:00 UTC (08:00 KST) — Disk check      (disk-check.sh)"
log ""
log "Root cron (installed by server-setup.sh):"
log "  03:00 UTC             — TLS cert renewal (certbot renew)"
