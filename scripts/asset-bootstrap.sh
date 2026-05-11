#!/usr/bin/env bash
# scripts/asset-bootstrap.sh — verify / create static asset directories.
#
# These are large 3D / loader artifacts that are *not* baked into the Docker
# image (.dockerignore excludes them, ~432 MB savings). They live on the host
# at /opt/thehideaway/assets/<id>/ and are bind-mounted read-only into the
# payload container by compose.prod.yaml.
#
# Source of truth is scripts/asset-manifest.json. Edit that file (or use
# `resolve` mode below) — never edit this script when adding/removing assets.
#
# ── Usage ────────────────────────────────────────────────────────────────────
#
#   ./scripts/asset-bootstrap.sh [MODE] [OPTIONS]
#
#   Modes:
#     check     (default) Dry-run. Print a present/missing table. No writes.
#                         Exits 1 if any required asset is missing.
#     init                Create missing directories. Idempotent. Used by
#                         server-setup.sh on first provision.
#     resolve             Interactive. For each missing entry, prompt:
#                         [i]gnore (this run) | [r]emove (from manifest) |
#                         [p]ath change (update manifest) | [a]bort
#
#   Options:
#     --root DIR          Override asset_root_default from the manifest.
#                         Useful for testing locally before deploy.
#     --manifest FILE     Path to manifest JSON (default: scripts/asset-manifest.json).
#     --json              Machine-readable output for `check` (CI / server-setup.sh).
#     --quiet             Suppress info logs; errors still printed.
#     --owner USER        Override owner from manifest (default: from JSON).
#     --group GROUP       Override group from manifest (default: from JSON).
#     -h | --help         Show this help.
#
# ── Examples ─────────────────────────────────────────────────────────────────
#
#   # Local dry-run against a staging dir before rsync to prod:
#   ./scripts/asset-bootstrap.sh check --root ./public/assets
#
#   # Server first-time provision (called by server-setup.sh):
#   ./scripts/asset-bootstrap.sh init
#
#   # Manifest got out of sync after a refactor — resolve interactively:
#   ./scripts/asset-bootstrap.sh resolve
#
#   # Scriptable check for CI:
#   if ! ./scripts/asset-bootstrap.sh check --json --quiet > /tmp/assets.json; then
#     jq '.missing' /tmp/assets.json
#   fi

set -Eeuo pipefail

# ── Constants ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_MANIFEST="${SCRIPT_DIR}/asset-manifest.json"

# ── Colour helpers ───────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  DIM='\033[2m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; DIM=''; BOLD=''; NC=''
fi

# ── Args / defaults ──────────────────────────────────────────────────────────
MODE="check"
MANIFEST="${DEFAULT_MANIFEST}"
ROOT_OVERRIDE=""
OWNER_OVERRIDE=""
GROUP_OVERRIDE=""
JSON_OUTPUT=false
QUIET=false

# ── Logging ──────────────────────────────────────────────────────────────────
info()  { [[ "${QUIET}" == true ]] || echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*" >&2; }
error() { echo -e "${RED}✗${NC}  $*" >&2; }
die()   { error "$*"; exit 1; }

usage() {
  sed -n '1,/^set -Eeuo/p' "$0" | sed -n '2,/^$/p' | sed 's/^# \{0,1\}//'
}

# ── Pre-flight ───────────────────────────────────────────────────────────────
command -v jq >/dev/null 2>&1 \
  || die "jq is required but not installed. apt install jq (or brew install jq)"

# ── Parse arguments ──────────────────────────────────────────────────────────
parse_args() {
  if [[ $# -gt 0 ]]; then
    case "$1" in
      check|init|resolve) MODE="$1"; shift ;;
      -h|--help) usage; exit 0 ;;
      --*) ;;  # leave for the loop below
      *)  die "Unknown mode: $1 (expected: check | init | resolve)" ;;
    esac
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --root)     ROOT_OVERRIDE="$2";  shift 2 ;;
      --manifest) MANIFEST="$2";       shift 2 ;;
      --owner)    OWNER_OVERRIDE="$2"; shift 2 ;;
      --group)    GROUP_OVERRIDE="$2"; shift 2 ;;
      --json)     JSON_OUTPUT=true;    shift ;;
      --quiet)    QUIET=true;          shift ;;
      -h|--help)  usage; exit 0 ;;
      *)          die "Unknown argument: $1 (try --help)" ;;
    esac
  done
}

# ── Manifest accessors ───────────────────────────────────────────────────────
load_manifest() {
  [[ -f "${MANIFEST}" ]] || die "Manifest not found: ${MANIFEST}"
  jq -e . "${MANIFEST}" >/dev/null 2>&1 \
    || die "Manifest is not valid JSON: ${MANIFEST}"
}

manifest_root() {
  if [[ -n "${ROOT_OVERRIDE}" ]]; then
    echo "${ROOT_OVERRIDE}"
  else
    jq -r '.asset_root_default' "${MANIFEST}"
  fi
}

manifest_owner() {
  if [[ -n "${OWNER_OVERRIDE}" ]]; then echo "${OWNER_OVERRIDE}"
  else jq -r '.owner // ""' "${MANIFEST}"; fi
}

manifest_group() {
  if [[ -n "${GROUP_OVERRIDE}" ]]; then echo "${GROUP_OVERRIDE}"
  else jq -r '.group // ""' "${MANIFEST}"; fi
}

manifest_mode() { jq -r '.mode // "0755"' "${MANIFEST}"; }

# Print one line per asset: id<TAB>path<TAB>required
manifest_assets() {
  jq -r '.assets[] | [.id, .path, (.required|tostring)] | @tsv' "${MANIFEST}"
}

# ── Mode: check ──────────────────────────────────────────────────────────────
do_check() {
  local root; root="$(manifest_root)"
  local missing_required=0
  local missing_optional=0
  declare -a present=() missing=()

  while IFS=$'\t' read -r id path required; do
    local full="${root%/}/${path}"
    if [[ -d "${full}" ]]; then
      present+=("${id}|${full}")
    else
      missing+=("${id}|${full}|${required}")
      if [[ "${required}" == "true" ]]; then
        missing_required=$((missing_required + 1))
      else
        missing_optional=$((missing_optional + 1))
      fi
    fi
  done < <(manifest_assets)

  if [[ "${JSON_OUTPUT}" == true ]]; then
    {
      printf '{\n  "root": "%s",\n  "present": [' "${root}"
      local first=true
      for entry in ${present[@]+"${present[@]}"}; do
        local id="${entry%%|*}"
        $first || printf ','
        printf '\n    {"id": "%s"}' "${id}"
        first=false
      done
      printf '\n  ],\n  "missing": ['
      first=true
      for entry in ${missing[@]+"${missing[@]}"}; do
        local id="${entry%%|*}"
        local path="${entry#*|}"; path="${path%|*}"
        local req="${entry##*|}"
        $first || printf ','
        printf '\n    {"id": "%s", "path": "%s", "required": %s}' \
          "${id}" "${path}" "${req}"
        first=false
      done
      printf '\n  ],\n  "missing_required": %d,\n  "missing_optional": %d\n}\n' \
        "${missing_required}" "${missing_optional}"
    }
  else
    info "Asset root: ${BOLD}${root}${NC}"
    echo
    printf "  %-12s  %-10s  %s\n" "ID" "STATUS" "PATH"
    printf "  %-12s  %-10s  %s\n" "──────────" "────────" "──────────────────────────────"

    local id full
    for entry in ${present[@]+"${present[@]}"}; do
      id="${entry%%|*}"
      full="${entry#*|}"
      printf "  %-12s  ${GREEN}%-10s${NC}  ${DIM}%s${NC}\n" "${id}" "present" "${full}"
    done

    for entry in ${missing[@]+"${missing[@]}"}; do
      id="${entry%%|*}"
      full="${entry#*|}"; full="${full%|*}"
      local req="${entry##*|}"
      local label
      if [[ "${req}" == "true" ]]; then
        label="${RED}MISSING${NC}"
      else
        label="${YELLOW}missing${NC}"
      fi
      printf "  %-12s  %-10b  %s\n" "${id}" "${label}" "${full}"
    done

    echo
    if [[ "${missing_required}" -gt 0 ]]; then
      error "${missing_required} required asset(s) missing."
      info "Fix with: ${BOLD}$(basename "$0") resolve${NC} (interactive) or ${BOLD}$(basename "$0") init${NC} (create empty dirs)"
    elif [[ "${missing_optional}" -gt 0 ]]; then
      warn "${missing_optional} optional asset(s) missing — non-fatal."
    else
      info "All assets present."
    fi
  fi

  [[ "${missing_required}" -eq 0 ]]
}

# ── Mode: init ───────────────────────────────────────────────────────────────
do_init() {
  local root owner group mode
  root="$(manifest_root)"
  owner="$(manifest_owner)"
  group="$(manifest_group)"
  mode="$(manifest_mode)"

  info "Initializing asset tree under ${BOLD}${root}${NC}"

  install -d -m "${mode}" "${root}" \
    || die "Failed to create root: ${root}"

  if [[ -n "${owner}" && -n "${group}" ]]; then
    chown "${owner}:${group}" "${root}" 2>/dev/null \
      || warn "Could not chown ${root} to ${owner}:${group} (need sudo?)"
  fi

  while IFS=$'\t' read -r id path _required; do
    local full="${root%/}/${path}"
    if [[ -d "${full}" ]]; then
      info "  ${id}: already present (${full})"
    else
      install -d -m "${mode}" "${full}" \
        && info "  ${id}: ${GREEN}created${NC} (${full})" \
        || warn "  ${id}: ${RED}failed${NC} to create ${full}"
      if [[ -n "${owner}" && -n "${group}" ]]; then
        chown "${owner}:${group}" "${full}" 2>/dev/null \
          || warn "    could not chown ${full}"
      fi
    fi
  done < <(manifest_assets)

  echo
  info "Done. Next: rsync the actual asset content from your dev machine into ${root}/"
}

# ── Mode: resolve (interactive) ──────────────────────────────────────────────
# Mutates the manifest JSON via a temp file + atomic mv.
update_manifest() {
  local jq_filter="$1"
  local tmp; tmp="$(mktemp)"
  if jq "${jq_filter}" "${MANIFEST}" > "${tmp}"; then
    mv "${tmp}" "${MANIFEST}"
  else
    rm -f "${tmp}"
    error "Manifest update failed; left untouched."
    return 1
  fi
}

resolve_one() {
  local id="$1"
  local current_path="$2"
  local full="$3"

  while true; do
    echo
    echo -e "  ${BOLD}${id}${NC}  ${DIM}(expected at ${full})${NC}"
    echo "    [i] ignore this run  (re-prompt next time)"
    echo "    [r] remove from manifest"
    echo "    [p] supply a different path"
    echo "    [a] abort"
    read -r -p "  choice: " choice

    case "${choice,,}" in
      i|ignore)
        info "  → ignored (manifest unchanged)"
        return 0
        ;;
      r|remove)
        update_manifest "del(.assets[] | select(.id == \"${id}\"))" \
          && info "  → removed from manifest"
        return 0
        ;;
      p|path)
        read -r -p "  new path (relative to asset root): " new_path
        if [[ -z "${new_path}" ]]; then
          warn "  empty path — try again"
          continue
        fi
        update_manifest "(.assets[] | select(.id == \"${id}\")).path = \"${new_path}\"" \
          && info "  → manifest updated: ${id}.path = ${new_path}"
        return 0
        ;;
      a|abort)
        info "Aborting; no further changes will be made this run."
        return 2
        ;;
      *)
        warn "  unrecognized — pick i / r / p / a"
        ;;
    esac
  done
}

do_resolve() {
  local root; root="$(manifest_root)"
  info "Resolving missing assets under ${BOLD}${root}${NC}"
  info "Manifest: ${MANIFEST}"

  local any_missing=false
  while IFS=$'\t' read -r id path _required; do
    local full="${root%/}/${path}"
    if [[ ! -d "${full}" ]]; then
      any_missing=true
      resolve_one "${id}" "${path}" "${full}" \
        || { rc=$?; [[ $rc -eq 2 ]] && return 0 || return $rc; }
    fi
  done < <(manifest_assets)

  if [[ "${any_missing}" == false ]]; then
    info "Nothing to resolve — all assets present."
  else
    echo
    info "Done. Re-run ${BOLD}$(basename "$0") check${NC} to verify."
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  parse_args "$@"
  load_manifest
  case "${MODE}" in
    check)   do_check ;;
    init)    do_init ;;
    resolve) do_resolve ;;
    *)       die "Unhandled mode: ${MODE}" ;;
  esac
}

main "$@"
