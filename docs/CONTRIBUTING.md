# Contributing

Hideaway is one Next.js app (`hideawayseoul`). Payload config is `src/payload.config.ts`. Longer subsystem notes stay in `readmes/`.

## Setup

Prerequisites from `package.json` `engines` and `packageManager`:

- Node `^18.20.2 || >=20.9.0`
- pnpm `^10 || ^11` (the `packageManager` field pins `pnpm@11.22.0`)
- Docker Desktop. `pnpm dev` runs `docker desktop start` and `docker start postgres`.

`compose.dev.yaml` attaches the `hideaway` network as `external: true`, so that network has to exist before Compose starts. The Postgres service publishes `5432`, database name `theestate`.

```bash
pnpm install
git config core.hooksPath .git-support/hooks
pnpm dev:init
```

`pnpm dev` starts Postgres, waits for port 5432, then `next dev`. `pnpm dev:init` runs `pnpm migrate` before the dev server. Copy the variable list in `docs/ENV.md` into `.env` and `.env.local`. Do not commit those files. Production values stay in `.env.production.enc`.

<!-- AUTO-GENERATED -->
## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Docker Desktop, start the `postgres` container, wait for port 5432, run `next dev` |
| `pnpm dev:init` | Same as `dev`, then `pnpm migrate` before `next dev` |
| `pnpm build` | `next build` (`NODE_OPTIONS=--no-deprecation`) |
| `pnpm start` | `next start` |
| `pnpm lint` | `next lint` |
| `pnpm format` | `next lint --fix`, then Prettier on `**/*.{json,yaml}` |
| `pnpm test` | `vitest run` |
| `pnpm generate:types` | `payload generate:types` (`PAYLOAD_CONFIG_PATH=src/payload.config.ts`) |
| `pnpm generate:schema` | `payload generate:db-schema` |
| `pnpm generate:importmap` | `payload generate:importmap` |
| `pnpm micreate` | `payload migrate:create`, then `node src/scripts/mig.ts` |
| `pnpm migrate` | `payload migrate` |
| `pnpm migrate:fresh` | `payload migrate:fresh` |
| `pnpm attic` | `bash scripts/attic.sh` |
| `pnpm attic:init` | `node scripts/attic-init.mjs` |
| `pnpm attic:snap` | `node scripts/attic-snap.mjs` |
| `pnpm seed:rebuild` | `tsx src/scripts/seedToMigration.ts` with `.env` and `.env.local` |
| `pnpm verify:env` | `scripts/verify-env.ts` |
| `pnpm sync:deploy-rules` | `scripts/sync-deploy-rules.ts sync` |
| `pnpm verify:deploy-rules` | `scripts/sync-deploy-rules.ts verify` |
| `pnpm env:template:gen` | Regenerate `.env.production.template` from `src/lib/env.ts` |
| `pnpm env:template:verify` | Check the template still matches `src/lib/env.ts` |
| `pnpm env:edit` | `sops` edit `.env.production.enc` |
| `pnpm env:decrypt` | `sops` decrypt `.env.production.enc` |
| `pnpm env:rotate-keys` | `sops updatekeys .env.production.enc` |
| `pnpm release:cut` | `scripts/cut-release.sh` |
| `pnpm release:check` | `scripts/cut-release.sh --check` (gates only, no tag) |
| `pnpm oauth:approval:report` | `scripts/oauth-approval-report.mjs` |
<!-- /AUTO-GENERATED -->

## Tests

`pnpm test` runs Vitest once. `vitest.config.ts` includes `src/**/*.{test,spec}.{ts,tsx}`, `scripts/**/*.{test,spec}.ts`, and `.git-support/**/*.{test,spec}.{ts,tsx}`. It excludes `node_modules`, `.attic`, `reference`, `.claude/worktrees`, and `.next`. The environment is `node`.

Files named `*.postgres.test.ts` skip when their database URI is unset. Commerce ledger tests read `COMMERCE_TEST_DATABASE_URI` (`src/lib/lost-commerce/inventory-ledger.postgres.fixtures.ts`). Migration tests under the same folder read `PR6A_MIGRATION_TEST_DATABASE_URI` or `COMMERCE_TEST_DATABASE_URI` per file.

`next.config.ts` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` does not fail on type errors.

## Style

ESLint is `eslint.config.mjs` (Next core-web-vitals, Next TypeScript, `eslint-config-prettier`). Prettier is `.prettierrc`: `prettier-plugin-tailwindcss`, double quotes, no trailing comma. `pnpm format` is the fixer checked into `package.json`.

The pre-commit hook at `.git-support/hooks/pre-commit` checks that the git-support migration files are staged, rejects a staged `media/catalog.json`, and runs `node .git-support/media.mjs sync-staged --stage`. It does not run ESLint or Prettier.

Active migrations live in `src/lib/migrations-baseline`. Procedure: `readmes/MIGRATIONS.md`.

## Pull request checklist

`scripts/cut-release.sh` is the release gate. A PR that is meant to ship should be able to pass the same checks:

- `pnpm verify:deploy-rules`
- `pnpm env:template:verify`
- `pnpm verify:env` against a decrypted env file
- `pnpm install --frozen-lockfile`
- `pnpm build`
- `pnpm test` for the area you changed

`pnpm release:cut` also requires a clean `main` that is not behind origin, unless `--force` or `RELEASE_ALLOW_NON_MAIN=1` is set. Do not add that flag on a normal PR.
