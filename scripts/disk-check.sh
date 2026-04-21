#!/usr/bin/env bash
# scripts/disk-check.sh — Disk space and Docker layer usage monitor.
#
# Prints a concise report and exits with code 1 if any threshold is exceeded.
# Safe to run as deploy or root; no side effects.
#
# Usage:
#   ./scripts/disk-check.sh               — report + exit 1 if over threshold
#   WARN_PCT=70 CRIT_PCT=85 ./scripts/disk-check.sh  — custom thresholds
#
# Schedule as a daily health check (crontab -e as deploy):
#   0 8 * * * /home/deploy/thehideaway/scripts/disk-check.sh
#            >> /home/deploy/disk-check.log 2>&1

set -euo pipefail

# ── Thresholds ────────────────────────────────────────────────────────────────
WARN_PCT="${WARN_PCT:-75}"   # yellow warning
CRIT_PCT="${CRIT_PCT:-90}"   # red critical / exit 1

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

# ── State tracking ────────────────────────────────────────────────────────────
OVER_THRESHOLD=0

check_fs() {
  local mount="$1"
  local used_pct
  used_pct="$(df "${mount}" --output=pcent 2>/dev/null | tail -1 | tr -d '% ')"

  local size avail
  size="$(df -h "${mount}" --output=size 2>/dev/null | tail -1 | xargs)"
  avail="$(df -h "${mount}" --output=avail 2>/dev/null | tail -1 | xargs)"

  local color="${GREEN}"
  local label="OK"
  if   [[ "${used_pct}" -ge "${CRIT_PCT}" ]]; then
    color="${RED}"; label="CRITICAL"; OVER_THRESHOLD=1
  elif [[ "${used_pct}" -ge "${WARN_PCT}" ]]; then
    color="${YELLOW}"; label="WARN"
  fi

  printf "  %-20s %s%3d%%%s  (%s used of %s, %s free)  [%s]\n" \
    "${mount}" "${color}" "${used_pct}" "${NC}" \
    "$(df -h "${mount}" --output=used 2>/dev/null | tail -1 | xargs)" \
    "${size}" "${avail}" "${label}"
}

# ── Report ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}  Disk Usage Report — $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

echo -e "${BOLD}  Filesystems${NC}"
echo "  ─────────────────────────────────────────────────────────────"
# Check root and any other mounted filesystems that look like real block devices
while IFS= read -r line; do
  mount_point=$(echo "${line}" | awk '{print $6}')
  # Skip pseudo filesystems
  [[ "${mount_point}" == /proc/* ]] && continue
  [[ "${mount_point}" == /sys/*  ]] && continue
  [[ "${mount_point}" == /dev/*  ]] && continue
  [[ "${mount_point}" == /run/*  ]] && continue
  check_fs "${mount_point}"
done < <(df -h --output=target 2>/dev/null | tail -n +2 | sort -u | grep -E '^(/|/[a-z])')

echo ""

# ── Docker disk usage ─────────────────────────────────────────────────────────
if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
  echo -e "${BOLD}  Docker disk usage${NC}"
  echo "  ─────────────────────────────────────────────────────────────"
  docker system df --format \
    'table  {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}' \
    2>/dev/null || echo "  (docker system df unavailable)"
  echo ""

  # Warn if reclaimable space is significant
  RECLAIMABLE_GB=$(docker system df 2>/dev/null \
    | awk 'NR>1 {
        match($0, /([0-9.]+)(GB|MB|KB)B reclaimable/, arr);
        if (arr[1] != "" && arr[2] == "G") total += arr[1]
      } END { printf "%.0f", total }')
  if [[ "${RECLAIMABLE_GB:-0}" -ge 2 ]]; then
    echo -e "  ${YELLOW}⚠${NC}  ${RECLAIMABLE_GB} GB reclaimable — run: docker system prune -f"
  fi
fi

# ── Backup directory ──────────────────────────────────────────────────────────
BACKUP_DIR="/home/deploy/backups"
if [[ -d "${BACKUP_DIR}" ]]; then
  BACKUP_SIZE="$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)"
  BACKUP_COUNT="$(find "${BACKUP_DIR}" -name "*.dump" 2>/dev/null | wc -l)"
  echo -e "${BOLD}  Database backups${NC}"
  echo "  ─────────────────────────────────────────────────────────────"
  printf "  %-20s %s  (%s file(s))\n" "${BACKUP_DIR}" "${BACKUP_SIZE}" "${BACKUP_COUNT}"
  echo ""
fi

# ── Exit code ─────────────────────────────────────────────────────────────────
if [[ "${OVER_THRESHOLD}" -eq 1 ]]; then
  echo -e "  ${RED}✗  CRITICAL: one or more filesystems exceed ${CRIT_PCT}% — action required${NC}"
  echo ""
  exit 1
else
  echo -e "  ${GREEN}✓  All filesystems within thresholds (warn: ${WARN_PCT}%, crit: ${CRIT_PCT}%)${NC}"
  echo ""
fi
