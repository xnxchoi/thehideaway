# syntax=docker.io/docker/dockerfile:1

FROM node:latest AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


# Update Corepack to the version with the fix and enable PNPM
RUN npm install -g corepack@0.34.0 && \
    corepack enable && \
    corepack prepare pnpm@10.30.3 --activate
# ADDED CODE 1 END

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Omit --production flag for TypeScript devDependencies
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install; \
    else echo "Lockfile not found." && exit 1; \
    fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .


# ADDED CODE 2 START
# Set up pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Update Corepack to the version with the fix and enable PNPM
RUN npm install -g corepack@0.34.0 && \
    corepack enable && \
    corepack prepare pnpm@10.30.3 --activate
# ADDED CODE 2 END

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

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1



RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run ci; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Production image, copy all the files and run next

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs


# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

USER nextjs

# Remove this line if you do not have this folder
COPY --from=builder /app/public ./public


# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static



# Runtime environment variables will be provided by Docker Compose
# No need to set them here as they'll come from .env.production

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output

CMD HOSTNAME="0.0.0.0" node server.js