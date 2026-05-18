#!/usr/bin/env bash
# prod.sh — DEPRECATED. Thin shim → scripts/deploy.sh.
#
# The legacy ./prod.sh flow (local docker build + `docker save | docker load`
# on the VPS) is superseded by the tag-driven ghcr.io flow in
# scripts/deploy.sh. This shim translates the old three modes:
#
#   ./prod.sh              → scripts/deploy.sh "${IMAGE_TAG:-latest}"
#   ./prod.sh --migrate    → scripts/deploy.sh "${IMAGE_TAG:-latest}" --migrate
#   ./prod.sh --full       → scripts/deploy.sh "${IMAGE_TAG:-latest}" --migrate
#                            (--full was deploy + backup + migrate; deploy.sh
#                             --migrate does the backup automatically)
#
# Existing consumers — scripts/first-deploy.sh phase 8 and any operator muscle
# memory — continue to work. New flows should call scripts/deploy.sh directly.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY="${SCRIPT_DIR}/scripts/deploy.sh"

if [[ ! -x "${DEPLOY}" ]]; then
  echo "✗ ${DEPLOY} not found or not executable." >&2
  echo "  Phase 4 of the deployment rewrite expects scripts/deploy.sh." >&2
  exit 1
fi

# One-line deprecation notice on stderr; doesn't block the operation.
echo "⚠  prod.sh is deprecated. Forwarding to scripts/deploy.sh." >&2
echo "   New surface: ./scripts/deploy.sh v1.2.3 [--migrate] | --status | --rollback" >&2

TAG="${IMAGE_TAG:-latest}"

case "${1:-}" in
  --migrate|--full)
    exec "${DEPLOY}" "${TAG}" --migrate
    ;;
  "")
    exec "${DEPLOY}" "${TAG}"
    ;;
  *)
    echo "Usage: $0 [--migrate | --full]" >&2
    echo "       (or set IMAGE_TAG=<tag> to deploy a specific version)" >&2
    exit 1
    ;;
esac
