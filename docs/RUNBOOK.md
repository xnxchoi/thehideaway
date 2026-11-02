# Runbook

Long-form deploy notes stay in `readmes/DEPLOY.md`. This page is the command sequence those scripts and Compose files actually implement.

<!-- AUTO-GENERATED -->
## Deploy

Laptop (`scripts/cut-release.sh`):

```bash
pnpm release:check          # gates only
pnpm release:cut            # next patch tag, or pass patch|minor|major|1.2.3
pnpm release:cut --ship     # after the tag: watch CI, then deploy
```

Gates inside `release:cut`: `pnpm verify:deploy-rules`, `pnpm env:template:verify`, decrypt-and-`verify:env`, `pnpm install --frozen-lockfile`, `pnpm build`. The script then commits the version bump and pushes `main` plus an annotated tag. The tag triggers the image build.

VPS, from `/home/deploy/thehideaway` (`scripts/deploy.sh`):

```bash
./scripts/deploy.sh --status
./scripts/deploy.sh v1.2.3
./scripts/deploy.sh v1.2.3 --migrate
./scripts/deploy.sh --rollback
```

`deploy.sh` checks the tag on `ghcr.io`, decrypts `.env.production.enc` with sops (age key `/etc/age/keys.txt`), pulls, then `docker compose up -d --wait`. Compose keeps the old `payload` container until the new one passes its healthcheck. Plaintext `.env.production` is removed on exit.

`--migrate` takes a `pg_dump` and then runs the one-shot service. Migrations do not run on app startup (`compose.prod.yaml` profile `migrate`).

```bash
docker compose -f compose.prod.yaml --profile migrate run --rm migrate
```

`--ship` on the laptop uses `DEPLOY_HOST` (default `deploy@hideawayseoul.com`) and `DEPLOY_DIR` (default `thehideaway`).

## Health

| Check | Source | Expect |
|---|---|---|
| `GET http://127.0.0.1:3000/api/health` | `compose.prod.yaml` `payload` healthcheck, `pack.Dockerfile` | curl exit 0 |
| `GET https://hideawayseoul.com/api/health` | `scripts/deploy.sh` smoke list | 200 within 60s |
| `GET https://lostinseoul.com/api/health` | same, unless `SKIP_LOST_SMOKE=1` | 200 within 60s |
| `GET https://www.lostinseoul.com/api/health` | same | 200 within 60s |
| Postgres `SELECT 1` | `compose.prod.yaml` `postgres` healthcheck | authenticated `psql` succeeds |
| `pg_isready -U postgres` | `compose.dev.yaml` | local socket open |

Nginx allows `/api/health` on the LOST host (`nginx/sites-enabled/production.conf`, `location = /api/health`). `src/proxy.ts` treats `/api/health` as exempt from the LOST gate. There is no `src/app/api/health/route.ts` in the tree. The container healthcheck and the smoke test both request that path.

Prod service caps in `compose.prod.yaml`: payload 1500m / 1.5 CPU, nginx 128m / 0.5 CPU, postgres 1024m / 1 CPU, Postgres 18, `max_connections=30`. The app pool is `max: 15` in `src/payload.config.ts`.

## Rollback

`./scripts/deploy.sh --rollback` redeploys the tag in `/var/lib/hideaway/previous-tag`. A failed smoke test rolls back to that tag before the script exits. Current tag is `/var/lib/hideaway/current-tag`.

Postgres major upgrades are not an image swap. `compose.prod.yaml` points at `scripts/pg-upgrade.sh` (dump, then restore).

## Scheduled checks

`scripts/cron-setup.sh` installs, for the deploy user:

| When | Script | Log |
|---|---|---|
| 17:00 UTC daily | `scripts/backup.sh` | `/var/log/thehideaway-cron.log` |
| 23:00 UTC daily | `scripts/disk-check.sh` | same |

`scripts/disk-check.sh` exits 1 when use passes `CRIT_PCT` (default 90). `WARN_PCT` defaults to 75. Cert renewal is a root cron from `scripts/server-setup.sh` at 03:00 UTC, not this file. Cron errors go to the local mailer only if one is configured. The repo has no pager or chat webhook.

## Common failures

| Symptom | Where it is defined | What to do |
|---|---|---|
| New container never becomes healthy | `compose.prod.yaml` healthcheck curls `/api/health` | Confirm something on port 3000 returns success for that path. No route file is in `src/app`. |
| Smoke test fails after `up --wait` | `scripts/deploy.sh` | The script rolls back. Then `./scripts/deploy.sh --status`. |
| Schema change did not apply | migrate profile | Migrations are manual. Run `./scripts/deploy.sh <tag> --migrate` after a backup. |
| `DATABASE_URI` breaks in Compose | `.env.production.template` | `POSTGRES_PASSWORD` must not contain `@ : / ? # [ ]`. |
| Prod boot lists missing env vars | `src/lib/env.ts` | Edit `src/lib/env.ts`, run `pnpm env:template:gen`, then `pnpm env:edit`. |
| Release script refuses the branch | `scripts/cut-release.sh` | Branch must be clean `main` and not behind origin. |
| pnpm version differs between laptop and image | `package.json` pins pnpm 11.22.0; `dev.Dockerfile` and `migrate.Dockerfile` run `corepack prepare pnpm@10.30.3` | Both satisfy `engines.pnpm` (`^10 \|\| ^11`). The image pin and the laptop pin are not the same. |
| Dev Compose build arg `EXCHANGE_RATE_KEY` | `compose.dev.yaml` | The schema name is `EXCHANGE_RATE_API_KEY` in `src/lib/env.ts`. |
| Dev Compose build arg `NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE` | `compose.dev.yaml` | Not declared in `src/lib/env.ts` or `.env.production.template`. |
<!-- /AUTO-GENERATED -->

Hand-written deploy, TLS, and nginx allowlist detail: `readmes/DEPLOY.md`.
