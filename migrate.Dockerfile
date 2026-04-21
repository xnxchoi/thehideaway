# syntax=docker.io/docker/dockerfile:1
#
# migrate.Dockerfile — one-shot migration runner.
#
# This image is NEVER deployed as a long-running service. It installs
# all dependencies (including devDeps for the Payload CLI), copies source,
# and runs `pnpm migrate` as a container that exits 0 on success.
#
# Operational notes:
#   - Always take a pg_dump backup BEFORE running migrations in production.
#   - Run as: docker compose -f compose.prod.yaml --profile migrate \
#               run --rm migrate
#   - PG major version upgrades (e.g. 18 → 19) require a full
#     pg_dump / pg_restore — you cannot simply swap the image tag.
#     See scripts/pg-upgrade.sh for the procedure.

FROM node:24-alpine AS runner
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS="--no-deprecation"

RUN apk add --no-cache libc6-compat && \
    npm install -g corepack@0.34.0 && \
    corepack enable && \
    corepack prepare pnpm@10.30.3 --activate

# Install all deps (devDeps included — Payload CLI and tsx are needed).
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Source files needed by payload.config.ts and the migration files.
# tsconfig.json is required so path aliases (@/) resolve correctly.
COPY tsconfig.json ./
COPY src/ ./src/

CMD ["pnpm", "migrate"]
