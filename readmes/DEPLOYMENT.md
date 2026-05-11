# Deployment — hideawayseoul.com

## Architecture

The Next.js app is built locally (or in CI), and `pack.Dockerfile` packages the pre-built
`.next/standalone` output into a slim runtime image. NEXT_PUBLIC_* vars are baked into the
client bundle at `pnpm build` time, so `.env.production` must exist on the build machine.
The production stack runs three containers — `payload` (Node 24), `nginx`, and `postgres:18-alpine`
— all on the `hideaway` Docker network, managed by `compose.prod.yaml` via `prod.sh` on the VPS.

---

## Prerequisites

### Local machine

- Node.js 20+
- pnpm 10.33.0 (`corepack prepare pnpm@10.33.0 --activate`)
- Docker Desktop (running)
- `.env.production` filled with real production values (see [Part 2, Step 1](#step-1-fill-envproduction))

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

### Step 2: Build images

From the repo root (with `.env.production` present):

```bash
./build.sh
```

This runs `pnpm build`, then packages two images tagged with the current git short SHA:
- `hideaway:<sha>` and `hideaway:latest` — slim runtime (~300 MB)
- `hideaway-migrate:<sha>` and `hideaway-migrate:latest` — migration runner

Note the SHA printed in the output — you need it for deployment.

To build and push directly to a registry:

```bash
REGISTRY=ghcr.io/xnxchoi/hideaway ./build.sh
```

### Step 3: Transfer images to VPS

**Option A — registry pull** (if you used a remote REGISTRY in Step 2):

```bash
# On the VPS as deploy:
IMAGE_TAG=<sha> REGISTRY=ghcr.io/xnxchoi/hideaway ./prod.sh
```

`prod.sh` calls `docker compose pull` which pulls from the registry automatically.

**Option B — direct transfer** (no registry required, default local build):

```bash
# On your local machine:
SHA=$(git rev-parse --short HEAD)

docker save hideaway:${SHA} hideaway-migrate:${SHA} | gzip \
  | rsync -e ssh --progress - deploy@<server-ip>:/tmp/hideaway-${SHA}.tar.gz

# On the VPS as deploy:
docker load < /tmp/hideaway-${SHA}.tar.gz
rm /tmp/hideaway-${SHA}.tar.gz
```

### Step 4: Clone repo and copy .env.production to VPS

```bash
# SSH as deploy:
ssh deploy@<server-ip>

# Clone the repo:
git clone https://github.com/xnxchoi/thehideaway.git ~/thehideaway
```

```bash
# From your local machine — copy .env.production:
scp .env.production deploy@<server-ip>:~/thehideaway/.env.production
```

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

```bash
# On the VPS as deploy:
cd ~/thehideaway
IMAGE_TAG=<sha> ./prod.sh
```

`prod.sh` will:
1. Verify or create the `hideaway` network
2. Pull the image (or use the locally-loaded one if no registry)
3. Run `docker compose up -d --wait` — starts postgres, waits for its healthcheck, then starts payload and nginx

Verify the deploy:

```bash
curl -s https://hideawayseoul.com/api/health
# Expected: {"ok":true}
```

---

## Part 3 — Every subsequent deploy

### Local machine

```bash
# 1. Build new images
./build.sh
SHA=$(git rev-parse --short HEAD)

# 2a. If using a registry:
REGISTRY=ghcr.io/xnxchoi/hideaway ./build.sh
# (build.sh pushes automatically when REGISTRY contains a /)

# 2b. If transferring directly:
docker save hideaway:${SHA} hideaway-migrate:${SHA} | gzip \
  | rsync -e ssh --progress - deploy@<server-ip>:/tmp/hideaway-${SHA}.tar.gz
```

### VPS

```bash
ssh deploy@<server-ip>
cd ~/thehideaway
git pull origin main         # pull updated compose.prod.yaml and scripts

# If using direct transfer (Option B):
docker load < /tmp/hideaway-${SHA}.tar.gz
rm /tmp/hideaway-${SHA}.tar.gz

# Deploy:
IMAGE_TAG=<sha> ./prod.sh
```

The running containers are replaced with zero-downtime (`--wait` keeps the old container
alive until the new one passes its healthcheck).

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
IMAGE_TAG=<sha> ./prod.sh --full
```

`--full` = deploy + backup + migrate in sequence.

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
- Wrong IMAGE_TAG — verify the tag exists with `docker images hideaway`
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
