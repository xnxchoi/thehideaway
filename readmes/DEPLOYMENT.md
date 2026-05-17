# Deployment — hideawayseoul.com

## Architecture

The Next.js app is built by **GitHub Actions** on every push to the `deploy` branch and
published to **ghcr.io** as `ghcr.io/xnxchoi/hideaway:<sha>` and `:latest`. `pack.Dockerfile`
packages the pre-built `.next/standalone` output into a slim runtime image. NEXT_PUBLIC_*
vars are baked into the client bundle at `pnpm build` time inside the workflow — they're
sourced from repo secrets, not from a local `.env.production`. The production stack runs
three containers — `payload` (Node 24), `nginx`, and `postgres:18-alpine` — all on the
`hideaway` Docker network, managed by `compose.prod.yaml` via `prod.sh` on the VPS. The VPS
pulls from ghcr.io; it never builds.

The two-branch model:

- **`main`** — active development, full codebase
- **`deploy`** — same code, leaner `.dockerignore`; push triggers the build workflow

To move work from `main` into a deploy, run [`scripts/sync-from-main.sh`](../scripts/sync-from-main.sh).
The build workflow lives in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

---

## Prerequisites

### Local machine

- Node.js 20+
- pnpm 10.33.0 (`corepack prepare pnpm@10.33.0 --activate`) — for local dev only,
  not required for deploys
- `git` with both `main` and `deploy` branches fetched
- `.env.production` filled with real production values (see [Part 2, Step 1](#step-1-fill-envproduction))
  — needed only on the VPS, not locally

Docker Desktop is **not** required. CI builds the image; you only need to push to `deploy`.

### GitHub

- `deploy` branch exists on `xnxchoi/thehideaway`
- Repo secrets: the workflow uses the auto-provided `GITHUB_TOKEN` for ghcr.io
  publishing — no extra secrets needed for the build itself
- Fine-grained PAT with `read:packages`, generated at
  <https://github.com/settings/tokens?type=beta> — the VPS uses this to pull images

### VPS

- Fresh Ubuntu 22.04 or 24.04 LTS
- SSH access as root
- DNS: `hideawayseoul.com` A record pointing to the server IP (propagated before TLS setup)

---

## Part 1 — One-time server setup

Run from your local machine. All steps are idempotent — safe to re-run.

### Step 1: SSH as root

```bash
ssh root@<server-ip>
```

### Step 2: Run server-setup.sh

> **For what gets hardened, the asset-manifest workflow, and Dockge access — see [`SERVER_HARDENING.md`](./SERVER_HARDENING.md).** That doc is the operational reference; this section just runs the script.

Copy the script to the server and execute it with your deploy user's SSH public key:

```bash
# On the server as root:
bash <(curl -fsSL https://raw.githubusercontent.com/xnxchoi/thehideaway/main/scripts/server-setup.sh) \
  --deploy-key "ssh-ed25519 AAAA... your-key-here"
```

Or if you have already cloned the repo:

```bash
bash scripts/server-setup.sh --deploy-key "ssh-ed25519 AAAA... your-key-here"
```

What this installs and configures (see `scripts/server-setup.sh` for the full list):
- System packages, 4 GB swap, sysctl network/fd tuning
- sshd hardening (root login disabled, password auth disabled, key-only)
- UFW firewall (22, 80, 443 only)
- Docker CE with log rotation and live-restore
- `deploy` user with docker group membership and no-password sudo
- Certbot
- Working directories: `/home/deploy/backups`, `/home/deploy/thehideaway`, `/var/www/certbot`
- Certbot renewal cron (daily 03:00)

**Verify SSH access as the deploy user BEFORE closing the root session:**

```bash
# In a NEW terminal, while root session is still open:
ssh deploy@<server-ip>
```

Only close the root session once you have confirmed deploy login works. If it fails with the
root session closed, you are locked out.

### Step 3: Create the Docker network

```bash
# As deploy on the VPS:
docker network create --ipv6=true hideaway
```

### Step 4: Get the TLS certificate

**Option A — standalone** (use this before nginx has ever started):

```bash
# As root or deploy on the VPS:
certbot certonly --standalone \
  -d hideawayseoul.com \
  -d www.hideawayseoul.com
```

**Option B — webroot** (use this if nginx is already running on port 80):

```bash
certbot certonly --webroot \
  -w /var/www/certbot \
  -d hideawayseoul.com \
  -d www.hideawayseoul.com
```

Certs are written to `/etc/letsencrypt/live/hideawayseoul.com/`. `compose.prod.yaml` mounts
`fullchain.pem` and `privkey.pem` from that path into the nginx container.

---

## Part 2 — Initial deployment

Run from your local machine unless noted.

### Step 1: Fill .env.production

Start from `.env.production.example` in the repo root — it documents every required
variable with placeholders and generation hints. Create `.env.production` alongside it
and fill in every secret:

```bash
cp .env.production.example .env.production
# Edit .env.production with real values
```

Variables that require real production values:

| Variable | Notes |
|---|---|
| `PAYLOAD_SECRET` | Random 64-char string — `openssl rand -hex 32` |
| `BETTER_AUTH_SECRET` | Random 64-char string |
| `PREVIEW_SECRET` | Random 32-char string |
| `CRON_SECRET` | Random 32-char string |
| `POSTGRES_PASSWORD` | Strong password — no `@` or `%` chars (breaks URI parsing) |
| `NEXT_PUBLIC_SERVER_URL` | `https://hideawayseoul.com` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | `https://hideawayseoul.com` |
| `COOKIE_DOMAIN` | `hideawayseoul.com` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `AUTH_ADMINS_GOOGLE_ID` | Admin-panel Google OAuth app |
| `AUTH_ADMINS_GOOGLE_SECRET` | Admin-panel Google OAuth app |
| `AUTH_NAVER_ID` | From Naver Developers |
| `AUTH_NAVER_SECRET` | From Naver Developers |
| `EXCHANGE_RATE_KEY` | Korea Exim Bank API |
| `HOLIDAY_API_KEY` | data.go.kr holiday API |
| `API_KEY_UNSPLASH` | Image search (admin only) |
| `BREVO_SMTP_USER` | Brevo SMTP credentials |
| `BREVO_SMTP_PASS` | Brevo SMTP credentials |
| `ASSETS_HOST_PATH` | VPS path for 3D assets (default: `/opt/thehideaway/assets`) |

`DATABASE_URI` is constructed dynamically in `compose.prod.yaml` from `POSTGRES_PASSWORD`,
`POSTGRES_USER`, and `POSTGRES_DB` — do not set it manually in `.env.production`.

### Step 2: Publish .env.production to repo secrets

CI needs `.env.production` at `pnpm build` time to bake NEXT_PUBLIC_* into the
client bundle. We pass it as a base64-encoded repo secret:

```bash
# From your laptop, in the repo root:
base64 -w0 .env.production | pbcopy        # Linux: drop -w0 if unsupported
                                            # macOS: base64 -i .env.production | pbcopy
```

Then paste the value at:

```
https://github.com/xnxchoi/thehideaway/settings/secrets/actions
  Name:  ENV_PRODUCTION_B64
  Value: <paste>
```

Rotate the secret whenever `.env.production` changes (new OAuth secret, new SMTP
password, etc.). The workflow refuses to build if the decoded file contains
placeholder values (`CHANGE_ME`, `your_`, etc.).

### Step 3: Publish images via CI

```bash
# From your laptop, in the repo root:
git checkout deploy
bash scripts/sync-from-main.sh    # merges main -> deploy, pushes
                                   # if deploy is already current, just:
                                   #   git push origin deploy
```

The workflow at `.github/workflows/deploy.yml` triggers on the push. Watch it at
<https://github.com/xnxchoi/thehideaway/actions>. ~5–8 minutes cold cache,
~2–3 minutes thereafter. On success, two images are published:

- `ghcr.io/xnxchoi/hideaway:<sha>` + `:latest` — runtime
- `ghcr.io/xnxchoi/hideaway-migrate:<sha>` + `:latest` — migration runner

Verify at <https://github.com/xnxchoi?tab=packages>.

**Local fallback.** If CI is down and you need to ship anything urgently, the
old `./build.sh` path still works: builds locally, then `docker save | ssh |
docker load` to the VPS. Treat it as a break-glass; the steady-state path is CI.

### Step 4: Clone repo (deploy branch) and copy .env.production to VPS

The VPS clones the `deploy` branch, not `main` — that's the branch CI builds
from, and the only one whose compose / scripts / `.dockerignore` are
production-aligned.

```bash
# SSH as deploy:
ssh deploy@<server-ip>

git clone --branch deploy https://github.com/xnxchoi/thehideaway.git ~/thehideaway
```

```bash
# From your local machine — copy .env.production:
scp .env.production deploy@<server-ip>:~/thehideaway/.env.production
ssh deploy@<server-ip> chmod 600 ~/thehideaway/.env.production
```

### Step 4b: Authenticate the deploy user to ghcr.io

The VPS needs a fine-grained PAT with `read:packages` so `docker pull` works.
Generate one at <https://github.com/settings/tokens?type=beta>, then:

```bash
# On the VPS as deploy:
echo "ghp_xxxxxxxxxxxxxxxxxxxx" | docker login ghcr.io \
  --username xnxchoi --password-stdin
```

Credentials persist in `~/.docker/config.json`. Rotate the PAT before expiry —
see Part 7 for the recovery snippet if pulls start failing.

### Step 5: Bootstrap 3D assets (one time only, before first deploy)

The `public/assets/plate/`, `public/assets/rp_plaque/`, and `public/assets/three/`
directories are committed to git for local dev but excluded from the Docker image via
`.dockerignore`. They are bind-mounted from the VPS host at runtime.

Create the target directories on the VPS:

```bash
# On the VPS as deploy:
sudo mkdir -p /opt/thehideaway/assets/{plate,rp_plaque,three}
sudo chown -R deploy:deploy /opt/thehideaway
```

Sync from your local machine (run once; the host dirs persist across all future deploys):

```bash
rsync -av --progress ./public/assets/plate/     deploy@<server-ip>:/opt/thehideaway/assets/plate/
rsync -av --progress ./public/assets/rp_plaque/ deploy@<server-ip>:/opt/thehideaway/assets/rp_plaque/
rsync -av --progress ./public/assets/three/     deploy@<server-ip>:/opt/thehideaway/assets/three/
```

This is a one-time operation. These files are not touched by subsequent deploys.

If `ASSETS_HOST_PATH` is customised in `.env.production`, create the dirs under that path
instead of `/opt/thehideaway/assets`.

### Step 6: First deploy

For a fresh VPS, the canonical path is the wrapper script — it bundles all of
Part 1 (server setup) and Part 2 (env / assets / first deploy) into one
command:

```bash
# On the VPS as root:
cd /root/thehideaway   # or wherever you rsync'd the repo
bash scripts/first-deploy.sh \
    --deploy-key "$(cat /your/laptop/~.ssh/hideaway_deploy.pub)" \
    --ghcr-user xnxchoi \
    --ghcr-pat  ghp_xxxxxxxxxxxxxxxxxxxx
```

See [LAUNCH.md](./LAUNCH.md) for the full end-to-end runbook including DNS,
TLS, and OAuth-console capture.

**Manual path** (skip the wrapper):

```bash
# On the VPS as deploy:
cd ~/thehideaway
REGISTRY=ghcr.io/xnxchoi/hideaway ./scripts/redeploy.sh latest
```

`redeploy.sh` calls `prod.sh`, which:
1. Verifies or creates the `hideaway` Docker network
2. Pulls the image from ghcr.io
3. Runs `docker compose up -d --wait` — starts postgres, waits for its
   healthcheck, then starts payload and nginx

Verify the deploy:

```bash
curl -s https://hideawayseoul.com/api/health
# Expected: {"ok":true}
```

---

## Part 3 — Every subsequent deploy

Two commands, no image transfer.

### Local machine

```bash
cd /local/path/to/thehideaway
bash scripts/sync-from-main.sh
```

This merges `main` into `deploy` and pushes. The push triggers
`.github/workflows/deploy.yml`, which builds + publishes new image tags to
ghcr.io. The script refuses dirty trees and prompts before pushing — use
`--yes` for non-interactive (CI / cron) flows. If no changes are pending it
exits cleanly with nothing to do.

Watch the build at <https://github.com/xnxchoi/thehideaway/actions>. The job
summary at the end prints the exact `redeploy.sh` command, including the SHA.

### VPS

```bash
ssh deploy@<server-ip>
cd ~/thehideaway
git pull origin deploy          # pull any updated compose/scripts changes
./scripts/redeploy.sh           # pulls :latest, recreates the stack
                                 # or: ./scripts/redeploy.sh <sha>
```

`redeploy.sh` is a thin wrapper over `prod.sh`. Containers are replaced with
zero-downtime — `--wait` keeps the old container alive until the new one passes
its healthcheck.

If the deploy includes a DB schema change, run with `--migrate`:

```bash
./scripts/redeploy.sh <sha> --migrate
```

That maps to `prod.sh --full`: deploy + backup + run migrations.

---

## Part 4 — Database migrations

**Migrations are never run automatically.** The migrate service only activates when you
pass `--profile migrate` (or call `./prod.sh --migrate`). This is intentional: an
accidental migration on a bad deploy could corrupt data.

**Always take a backup before running migrations:**

```bash
# On the VPS as deploy:
cd ~/thehideaway
./scripts/backup.sh
```

Then run migrations:

```bash
./prod.sh --migrate
# Equivalent to:
# docker compose -f compose.prod.yaml exec -T postgres \
#   pg_dump -U postgres -Fc theestate > backup-<timestamp>.dump
# docker compose -f compose.prod.yaml --profile migrate run --rm migrate
```

To deploy a new image and run migrations in one step:

```bash
./scripts/redeploy.sh <sha> --migrate
# Equivalent to: IMAGE_TAG=<sha> ./prod.sh --full
```

`--migrate` (on redeploy) → `--full` (on prod.sh) = deploy + backup + migrate
in sequence.

**PostgreSQL major version upgrades** (e.g. 18 → 19) cannot be done by swapping the image
tag — the on-disk data format changes. Use `scripts/pg-upgrade.sh`, which performs a
controlled dump/restore upgrade with a maintenance window.

---

## Part 5 — Scheduled maintenance (cron jobs)

Run `scripts/cron-setup.sh` once as the `deploy` user to install all maintenance crons:

```bash
# On the VPS as deploy:
cd ~/thehideaway
bash scripts/cron-setup.sh
```

What gets scheduled (as the `deploy` user):

| UTC | KST | Script | Purpose |
|---|---|---|---|
| 17:00 | 02:00 | `scripts/backup.sh` | pg_dump with 7-day retention |
| 23:00 | 08:00 | `scripts/disk-check.sh` | Disk usage report, warns at 80%, critical at 90% |

TLS cert renewal (`certbot renew`) is installed as **root** by `scripts/server-setup.sh`
at 03:00 UTC. It is not duplicated here.

Backup files are written to `/home/deploy/backups/` as `theestate-<timestamp>.dump`
(pg_dump custom format). Default retention: 7 days. Override with `KEEP=14 ./scripts/backup.sh`.

---

## Part 6 — Operational reference

### Viewing logs

```bash
# All services:
docker compose -f compose.prod.yaml logs -f

# Single service:
docker compose -f compose.prod.yaml logs -f payload
docker compose -f compose.prod.yaml logs -f nginx
docker compose -f compose.prod.yaml logs -f postgres
```

Nginx access/error logs are also available at `~/thehideaway/nginx/logs/` on the host
(bind-mounted from the container).

### Restarting a service

```bash
docker compose -f compose.prod.yaml restart payload
```

### Restoring a database backup

```bash
# backup.sh produces pg_dump custom format (-Fc).
# Restore with pg_restore (not psql):

BACKUP_FILE=/home/deploy/backups/theestate-20260421-020000.dump

docker compose -f /home/deploy/thehideaway/compose.prod.yaml exec -T postgres \
  pg_restore -U postgres -d theestate < "${BACKUP_FILE}"
```

For a full restore to a fresh database, add `--clean --if-exists`:

```bash
docker compose -f /home/deploy/thehideaway/compose.prod.yaml exec -T postgres \
  pg_restore -U postgres --clean --if-exists -d theestate < "${BACKUP_FILE}"
```

### Updating nginx config

Edit `nginx/sites-enabled/production.conf` in the repo, pull on the VPS, then reload
nginx without downtime:

```bash
git pull origin main
docker compose -f compose.prod.yaml exec nginx nginx -s reload
```

Validate the config before reloading:

```bash
docker compose -f compose.prod.yaml exec nginx nginx -t
```

### Pruning old Docker images

After a few deploys, unused images accumulate. Prune images older than 7 days:

```bash
docker image prune -a --filter "until=168h"
```

Run `scripts/disk-check.sh` first to see how much space is reclaimable.

### Checking health

```bash
curl -s https://hideawayseoul.com/api/health
# {"ok":true}
```

The health endpoint pings the database. A 200 response means the app container is running
and has an active DB connection.

---

## Part 7 — Troubleshooting

### Container won't start

```bash
docker compose -f compose.prod.yaml logs payload
```

Common causes:
- Missing or malformed `.env.production` — check that all required vars are present
- Postgres healthcheck not yet passing — `payload` depends on postgres being healthy;
  watch `docker compose -f compose.prod.yaml logs postgres`
- Wrong IMAGE_TAG — verify the tag exists on ghcr.io:
  `docker manifest inspect ghcr.io/xnxchoi/hideaway:<sha>`. If that fails with
  "manifest unknown", the workflow hasn't published it yet — check
  <https://github.com/xnxchoi/thehideaway/actions>. If it fails with
  "unauthorized", the deploy user's PAT expired — re-run `docker login ghcr.io`
- 3D asset bind mount path missing — verify `/opt/thehideaway/assets/{plate,rp_plaque,three}` exist

### DB connection refused

```bash
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs postgres
```

`DATABASE_URI` in the container is assembled from `POSTGRES_PASSWORD`, `POSTGRES_USER`,
and `POSTGRES_DB` in `.env.production`. Verify those are set and the password contains no
special URL characters (`@`, `%`, `#`).

### TLS cert expired

```bash
# Force renewal:
certbot renew --force-renewal \
  --webroot -w /var/www/certbot \
  -d hideawayseoul.com \
  -d www.hideawayseoul.com

# Reload nginx to pick up the new cert:
docker compose -f /home/deploy/thehideaway/compose.prod.yaml exec nginx nginx -s reload
```

The renewal cron installed by `server-setup.sh` runs daily at 03:00 and reloads nginx
automatically on success. A cert expiry means the cron either failed or the hook
did not fire. Check `crontab -l` as root to confirm the entry is present.

### Disk full

```bash
bash ~/thehideaway/scripts/disk-check.sh
```

First pass — prune Docker layers:

```bash
docker image prune -a --filter "until=168h"
docker builder prune -f
```

Second pass — old backups:

```bash
ls -lh /home/deploy/backups/
# Remove backups beyond your retention window manually if needed
```

The 100 GB HDD on the ITEASY VPS is the tightest constraint. Named volumes for
`pgdata` and upload media grow with content. Monitor regularly with `disk-check.sh`.

### App returns 502

nginx is up but the payload container is not responding. Check:

```bash
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs --tail=50 payload
```

If the container is in a restart loop, the most common cause is a failed DB connection
on startup. Verify postgres is healthy:

```bash
docker compose -f compose.prod.yaml exec postgres \
  pg_isready -U postgres -d theestate
```

If postgres is healthy and payload is still crashing, check for a missing required
environment variable — Payload will throw and exit on startup if `PAYLOAD_SECRET`
or `DATABASE_URI` is absent or malformed.
