# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat curl && \
    npm install -g corepack@0.34.0 && \
    corepack enable && \
    corepack prepare pnpm@10.30.3 --activate

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Only set public environment variables at build time
# Private variables will be set at runtime via Docker Compose
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ARG NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE
ENV NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE=${NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE}
ARG NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE
ENV NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE=${NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE}
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}
ARG NEXT_PUBLIC_EXCHANGE_RATE_URL
ENV NEXT_PUBLIC_EXCHANGE_RATE_URL=${NEXT_PUBLIC_EXCHANGE_RATE_URL}
ARG NEXT_PUBLIC_HOLIDAY_API_URL
ENV NEXT_PUBLIC_HOLIDAY_API_URL=${NEXT_PUBLIC_HOLIDAY_API_URL}

ENV NEXT_TELEMETRY_DISABLED=1

# Placeholder DATABASE_URI for build-time page data collection.
# Payload initializes at build; real URI is injected at runtime via compose.
ENV DATABASE_URI=postgres://build:build@localhost:5432/build
ENV PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime
ENV BETTER_AUTH_SECRET=build-time-placeholder-not-used-at-runtime
ENV NEXT_PHASE=phase-production-build

RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir .next && chown nextjs:nodejs .next

USER nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
