# syntax=docker.io/docker/dockerfile:1
#
# pack.Dockerfile — runtime packaging only.
#
# This file does NOT build the Next.js app. Run `pnpm build` locally (or in CI)
# first, then build this image. The .next/standalone output is copied directly.
#
# Why split build from packaging:
#   - Next.js Payload initialises the DB pool during "collect page data".
#     A build-time DB is not available (and shouldn't be needed).
#   - Keeping build artefacts on the host means the registry image is
#     reproducible from a known local state, not from a Docker layer cache.
#
# Usage:
#   pnpm build
#   docker build -f pack.Dockerfile -t hideaway:$(git rev-parse --short HEAD) .

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Debian (glibc) base — NOT Alpine. `pnpm build` runs on the glibc CI runner,
# so .next/standalone carries glibc-linked native modules — notably sharp's
# prebuilt binary. A musl/Alpine runtime cannot load them and fails at boot
# with "Could not load the sharp module using the linuxmusl-x64 runtime".
# curl: needed for the HEALTHCHECK below.
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

RUN mkdir .next && chown nextjs:nodejs .next

USER nextjs

# Pre-built artefacts from `pnpm build` on the host.
# next.config.ts must set `output: "standalone"` or these COPYs fail with a
# cryptic "stat ... no such file" error. build.sh runs a preflight check
# (.next/standalone/server.js + .next/static) before reaching this step so
# the failure surfaces with an actionable hint instead.
COPY public ./public
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
