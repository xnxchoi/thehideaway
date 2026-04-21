#!/usr/bin/env bash
# build.sh — build the Next.js app and package both Docker images.
#
# Usage:
#   ./build.sh [TAG]
#
#   TAG defaults to the current git short SHA (e.g. a1b2c3d).
#
# Environment variables:
#   REGISTRY   — image name / registry prefix.
#                Default: "hideaway"  (local only, no push)
#                Remote:  "ghcr.io/your-org/hideaway"  (pushes to GHCR)
#
# Prerequisites:
#   - .env.production must exist and contain all NEXT_PUBLIC_* vars.
#     Next.js reads it during `pnpm build` and bakes NEXT_PUBLIC values into
#     the JS bundle. No DB connection is needed at build time.
#   - Docker must be running.
#   - pnpm must be available (same version as pnpm-lock.yaml: 10.30.3).
#
# What this produces:
#   ${REGISTRY}:${TAG}          — slim runtime image (~300 MB, Node 24 Alpine)
#   ${REGISTRY}:latest          — same image, latest tag
#   ${REGISTRY}-migrate:${TAG}  — migration runner image (has pnpm + full source)
#   ${REGISTRY}-migrate:latest  — same, latest tag
#
# Examples:
#   ./build.sh                                          # local, uses git SHA
#   ./build.sh v1.2.0                                   # local, explicit tag
#   REGISTRY=ghcr.io/myorg/hideaway ./build.sh          # push to GHCR

set -euo pipefail

TAG="${1:-$(git rev-parse --short HEAD)}"
REGISTRY="${REGISTRY:-hideaway}"

RUNTIME_IMAGE="${REGISTRY}:${TAG}"
RUNTIME_LATEST="${REGISTRY}:latest"
MIGRATE_IMAGE="${REGISTRY}-migrate:${TAG}"
MIGRATE_LATEST="${REGISTRY}-migrate:latest"

echo ""
echo "  hideaway build"
echo "  tag:      ${TAG}"
echo "  registry: ${REGISTRY}"
echo ""

# ── 1. Next.js build ──────────────────────────────────────────────────────────
# .env.production is loaded automatically by Next.js.
# NEXT_PUBLIC_* values are baked into the client bundle here.
echo "→ [1/4] Building Next.js (pnpm build)..."
pnpm build
echo ""

# ── 2. Runtime image ──────────────────────────────────────────────────────────
echo "→ [2/4] Packaging runtime image: ${RUNTIME_IMAGE}"
docker build \
  -f pack.Dockerfile \
  -t "${RUNTIME_IMAGE}" \
  -t "${RUNTIME_LATEST}" \
  .
echo ""

# ── 3. Migration runner image ─────────────────────────────────────────────────
echo "→ [3/4] Building migration runner: ${MIGRATE_IMAGE}"
docker build \
  -f migrate.Dockerfile \
  -t "${MIGRATE_IMAGE}" \
  -t "${MIGRATE_LATEST}" \
  .
echo ""

# ── 4. Push (only when REGISTRY looks like a remote) ─────────────────────────
if [[ "${REGISTRY}" == *"/"* ]]; then
  echo "→ [4/4] Pushing to registry..."
  docker push "${RUNTIME_IMAGE}"
  docker push "${RUNTIME_LATEST}"
  docker push "${MIGRATE_IMAGE}"
  docker push "${MIGRATE_LATEST}"
  echo ""
  echo "  Pushed:"
  echo "    ${RUNTIME_IMAGE}"
  echo "    ${MIGRATE_IMAGE}"
else
  echo "→ [4/4] Local build — skipping push."
  echo "  To push: REGISTRY=ghcr.io/your-org/hideaway ./build.sh ${TAG}"
fi

echo ""
echo "✓ Done."
echo ""
docker images "${REGISTRY}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}" 2>/dev/null || true
