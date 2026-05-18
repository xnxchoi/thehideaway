# Deploy — hideawayseoul.com

Single canonical deploy reference. Sequenced runbook for first launch up top,
operational reference below. The scripts in `scripts/` are authoritative for
what actually runs — this doc orients you and explains the *why*.

```
LAPTOP                          GITHUB ACTIONS                ghcr.io                 VPS
──────                          ──────────────                ───────                 ───
git push origin deploy  ─────►  build & push images  ───────► hideaway[-migrate]:<sha>
                                                                       │
                                                                       ▼
                                                              docker pull on the VPS
                                                                       │
                                                                       ▼
                                                              prod.sh up -d --wait
```

Two branches: **`main`** (active development) and **`deploy`** (lean, CI-built).
Push to `deploy` → CI publishes images → VPS pulls. The VPS never builds.

---

## § 1 — Scripts index

| Script | Run from | Purpose |
|---|---|---|
| `scripts/sync-from-main.sh` | laptop | Merge `main` → `deploy`, push (triggers CI). |
| `scripts/sync-repo-to-vps.sh` | laptop | First-deploy only: rsync repo to `/root/thehideaway/` on a fresh VPS, honoring `.deployignore`. |
| `scripts/first-deploy.sh` | VPS (root) | One-shot first-deploy wrapper. 8 phases: sanity → server-setup → DNS → cert → GitHub auth → repo clone → pre-flight → deploy. |
| `scripts/server-setup.sh` | VPS (root, called by first-deploy.sh) | OS hardening, Docker, deploy user, certbot, working dirs. |
| `scripts/asset-bootstrap.sh` | VPS (deploy) | Verifies `/opt/thehideaway/assets/{plate,rp_plaque,three}/` are populated. |
| `scripts/redeploy.sh` | VPS (deploy) | Subsequent deploys: pull a tag from ghcr.io and recreate the stack. Optionally `--migrate`. |
| `prod.sh` | VPS (deploy, called by redeploy.sh) | Lower-level: `docker compose pull/up/migrate`. Use `redeploy.sh` directly. |
| `scripts/backup.sh` | VPS (deploy, cron) | `pg_dump` with retention. Files written `0600` under `/home/deploy/backups/`. |
| `scripts/cron-setup.sh` | VPS (deploy) | One-time installer for `backup.sh` + `disk-check.sh` crons. |
| `scripts/disk-check.sh` | VPS (deploy, cron) | Warns at 80%, critical at 90%. |
| `scripts/pg-upgrade.sh` | VPS (deploy, manual) | Major-version PostgreSQL upgrade (e.g. 18 → 19). |
| `.deployignore` | — | What `sync-repo-to-vps.sh` excludes from the rsync to `/root/`. Editable. |
| `.github/workflows/deploy.yml` | GitHub Actions | On push to `deploy`: build `pack.Dockerfile` + `migrate.Dockerfile`, push to ghcr.io. |

---

## § 2 — First-time launch (90 minutes, do this once)

### T-minus prep

Have these ready before opening any terminal session. Interrupting later to
chase a missing credential is the single biggest source of wasted launch time.

#### Accounts + credentials

- [ ] **GitHub** access to `xnxchoi/thehideaway`
- [ ] **Google Cloud Console** signed in as `hideawayseoul@gmail.com`
- [ ] **Naver Developers** signed in to the app's owning Naver ID
- [ ] **Brevo** SMTP credentials (`app.brevo.com/settings/keys/smtp`)
- [ ] **Mapbox** access token (`account.mapbox.com/access-tokens`)
- [ ] **ITEasy** VPS provisioned, root SSH confirmed, public IP noted
- [ ] **DNS provider** access to set the A record for `hideawayseoul.com`

#### Local machine

- [ ] `git` with `main` checked out and clean
- [ ] SSH keypair for the deploy user — `ssh-keygen -t ed25519 -f ~/.ssh/hideaway_deploy`
- [ ] `.env.production` filled with real values (work from `.env.production.example`)
- [ ] `public/assets/{plate,rp_plaque,three}/` populated locally (~432 MB)

Docker Desktop is **not** required — CI builds, the VPS pulls.

#### GitHub side (Step 1 below walks you through these in order)

- [ ] `deploy` branch exists on `xnxchoi/thehideaway`
- [ ] `ENV_PRODUCTION_B64` repo secret set
- [ ] Fine-grained PAT created with `read:packages` scope
- [ ] PAT has explicit access to the `hideaway` + `hideaway-migrate` packages

---

### Step 1 — ghcr.io prereqs

**1a. Create the `deploy` branch on origin.** From your laptop, in the repo root:

```bash
git checkout main && git pull
git checkout -b deploy
git push -u origin deploy
```

**1b. Set the `ENV_PRODUCTION_B64` repo secret.** CI needs `.env.production`
at build time to bake `NEXT_PUBLIC_*` into the client bundle.

```bash
# macOS:
base64 -i .env.production | pbcopy
# Linux:
base64 -w0 .env.production | xclip -selection clipboard
```

Paste at <https://github.com/xnxchoi/thehideaway/settings/secrets/actions> →
**New repository secret** → name `ENV_PRODUCTION_B64`.

**Rotate this secret whenever `.env.production` changes** (new OAuth secret,
new SMTP password, etc.). The workflow refuses to build if the decoded file
still has placeholders (`CHANGE_ME`, `your_`, etc.).

**1c. Create a fine-grained PAT.** Go to
<https://github.com/settings/tokens?type=beta> → **Generate new token**:

| Field | Value |
|---|---|
| Token name | `hideawayseoul.com — ghcr.io pull` |
| Expiration | 90 days (calendar a reminder to rotate) |
| Repository access | Only `xnxchoi/thehideaway` |
| Permissions → Repository → Contents | Read-only (for `git clone` later) |
| Permissions → Account → Packages | Read-only |

Copy the token. **It only displays once.** Save it where you'll find it later
in this runbook.

**1d. Trigger the first CI build.** From your laptop:

```bash
bash scripts/sync-from-main.sh --yes
```

This merges `main` → `deploy` and pushes. Watch the workflow at
<https://github.com/xnxchoi/thehideaway/actions>. ~5–8 min cold cache,
~2–3 min thereafter. On success it publishes:

- `ghcr.io/xnxchoi/hideaway:<sha>` + `:latest`
- `ghcr.io/xnxchoi/hideaway-migrate:<sha>` + `:latest`

Verify at <https://github.com/xnxchoi?tab=packages>.

**1e. Grant the PAT explicit access to the new packages.** Private packages on
ghcr.io require explicit PAT access — having `read:packages` scope alone is
not enough.

For each of the two packages, go to its settings:

- <https://github.com/users/xnxchoi/packages/container/hideaway/settings>
- <https://github.com/users/xnxchoi/packages/container/hideaway-migrate/settings>

Scroll to **Manage Actions access** / **Manage installed**. Add your PAT (or
the user account that owns it) with **Read** access.

> Without this, `docker pull` on the VPS returns `denied: denied` even though
> the PAT has `read:packages`. This is the most common ghcr.io first-launch
> failure — don't skip it.

---

### Step 2 — Bootstrap the repo onto the VPS

The wrapper script lives in the repo, so it needs to be on the VPS before
GitHub auth is configured for the deploy user. From your laptop, on the
`deploy` branch:

```bash
git checkout deploy
bash scripts/sync-repo-to-vps.sh --dry-run root@rp.hideawayseoul.com
```

Scan the dry-run output for anything that shouldn't be transferred. If
anything looks wrong, add it to `.deployignore` and re-run the dry-run.

When it looks right:

```bash
bash scripts/sync-repo-to-vps.sh root@rp.hideawayseoul.com
```

**Check:**

```bash
ssh root@rp.hideawayseoul.com 'du -sh /root/thehideaway && ls /root/thehideaway/scripts/first-deploy.sh'
```

Expect a few tens of MB and the path to exist.

---

### Step 3 — Stage `.env.production` and the asset tree

Phase 7 of the wrapper (Step 5 below) validates both are in place. Pre-stage
them now so Phase 7 passes on the first run.

```bash
# .env.production — into the deploy user's repo path. Phase 6 of the wrapper
# clones on top, preserving the env file via mv-aside/restore.
ssh deploy@rp.hideawayseoul.com 'mkdir -p ~/thehideaway && chmod 700 ~/thehideaway'
scp .env.production deploy@rp.hideawayseoul.com:~/thehideaway/.env.production
ssh deploy@rp.hideawayseoul.com 'chmod 600 ~/thehideaway/.env.production'

# Asset tree (~432 MB) — into the bind-mount target.
ssh deploy@rp.hideawayseoul.com 'sudo mkdir -p /opt/thehideaway/assets && sudo chown -R deploy:deploy /opt/thehideaway'
rsync -av --progress ./public/assets/ deploy@rp.hideawayseoul.com:/opt/thehideaway/assets/
```

**Check:**

```bash
ssh deploy@rp.hideawayseoul.com 'ls -l ~/thehideaway/.env.production && du -sh /opt/thehideaway/assets/'
```

Env file should be `-rw-------`. Asset tree should be ~432 MB.

---

### Step 4 — Set the DNS A record

In your DNS provider's dashboard:

| Type | Name       | Value           | TTL  |
|------|------------|-----------------|------|
| A    | `@` (apex) | `<vps-ip>`      | 300  |
| A    | `www`      | `<vps-ip>`      | 300  |

300s TTL gives faster propagation now. Raise to 3600 a few days after launch.

**Check:**

```bash
dig +short A hideawayseoul.com @1.1.1.1
```

Should return `<vps-ip>`. Propagation: 30s to ~30 min depending on region.
The wrapper polls for ~10 min in Phase 3, so you can start the wrapper
even before DNS has fully propagated.

---

### Step 5 — Run the wrapper

```bash
ssh root@rp.hideawayseoul.com
cd /root/thehideaway

bash scripts/first-deploy.sh \
    --deploy-key "$(cat << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... deploy@hideawayseoul.com
EOF
)" \
    --ghcr-user xnxchoi \
    --ghcr-pat  ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Paste the full content of `~/.ssh/hideaway_deploy.pub` from your laptop
inside the heredoc on the line where the `ssh-ed25519` placeholder is. The
PAT is the one from Step 1c.

The wrapper runs 8 phases:

| Phase | Does |
|-------|------|
| 1/8 | Sanity — root on Ubuntu, server-setup.sh present |
| 2/8 | `server-setup.sh` — OS hardening, Docker, certbot, deploy user |
| 3/8 | DNS poll — waits for the A record to point to this machine |
| 4/8 | `certbot --standalone` — issues the TLS cert |
| 5a/8 | **INTERACTIVE** — prints an ed25519 pubkey, pauses for you to paste it at <https://github.com/xnxchoi/thehideaway/settings/keys/new> (Title: hideawayseoul.com — deploy, write access **OFF**) |
| 5b/8 | `docker login ghcr.io` with the PAT |
| 6/8 | `git clone --branch deploy` into `/home/deploy/thehideaway` (preserves your pre-staged `.env.production`) |
| 7/8 | Pre-flight — validates env, asset tree, image manifests on ghcr.io |
| 8/8 | `prod.sh --full` — deploy + backup + migrate, plus a smoke test of `/privacy` |

**Check:** wrapper prints `✓ First deploy complete.` at the end.

---

### Step 6 — Smoke test

From your laptop:

```bash
for path in / /sign-in /sign-up /privacy /terms; do
  printf "%-12s %s\n" "$path" "$(curl -s -o /dev/null -w '%{http_code}' https://hideawayseoul.com$path)"
done
```

Expected: all 200s.

Open `https://hideawayseoul.com/sign-in` in an incognito window. Confirm:

- [ ] Page renders without console errors
- [ ] Google + Naver + Passkey buttons all visible
- [ ] Email/password fields work (try a signup → cancel before submit)
- [ ] Theme + locale toggles work

---

### Step 7 — OAuth consoles

**7a. Capture production screenshots.** Naver review historically rejects
dev-mode (`localhost`) captures. Take fresh ones from production:

```bash
cd /tmp/hideaway-shots  # the playwright sandbox from earlier
# Edit capture.mjs: change http://localhost:3000 → https://hideawayseoul.com
node capture.mjs
# Output lands in <repo>/readmes/oauth-approval/screenshots/*-prod.png
```

**7b. Submit consoles.** **Google first** — typically auto-approves the same
day for non-sensitive scopes.

- [ ] `readmes/oauth-approval/01-google-console.md` — phases 1–5
- [ ] `readmes/oauth-approval/02-naver-console.md` — phases 1–3

After Google approves: paste the real `GOOGLE_CLIENT_SECRET` into
`.env.production` on the VPS, then:

```bash
ssh deploy@rp.hideawayseoul.com
cd thehideaway
./scripts/redeploy.sh    # pull :latest, recreate the stack
```

Repeat for Naver after their email lands (1–3 business days typical).

---

## § 3 — Subsequent deploys

Two commands, no image transfer, no docker save/load:

```bash
# Laptop — merge main → deploy and push (triggers CI build)
bash scripts/sync-from-main.sh

# Watch CI: https://github.com/xnxchoi/thehideaway/actions
# When green:

# VPS — pull and recreate
ssh deploy@rp.hideawayseoul.com
cd thehideaway
./scripts/redeploy.sh           # pull :latest, recreate stack
# Or to deploy a specific SHA:
./scripts/redeploy.sh <sha>
# Or to also run migrations:
./scripts/redeploy.sh <sha> --migrate
```

Containers are replaced with zero downtime — compose `--wait` keeps the old
container alive until the new one passes its healthcheck.

---

## § 4 — Reference

### Migrations

**Migrations never run automatically.** The `migrate` compose service only
activates with `--profile migrate`. An accidental migration on a bad deploy
could corrupt data.

Always take a backup first:

```bash
ssh deploy@rp.hideawayseoul.com
cd thehideaway
./scripts/backup.sh
```

Then:

```bash
./scripts/redeploy.sh <sha> --migrate    # deploy + backup + migrate
# or, if you only need to run migrations against the current image:
./prod.sh --migrate
```

PostgreSQL **major-version upgrades** (e.g. 18 → 19) cannot be done by
swapping the image tag — the on-disk format changes. Use
`scripts/pg-upgrade.sh`, which performs a controlled dump/restore upgrade.

### Backups + scheduled crons

Install once on the VPS as `deploy`:

```bash
cd ~/thehideaway
bash scripts/cron-setup.sh
```

What it schedules:

| UTC   | KST   | Script              | Purpose |
|-------|-------|---------------------|---------|
| 17:00 | 02:00 | `scripts/backup.sh` | `pg_dump` with 7-day retention |
| 23:00 | 08:00 | `scripts/disk-check.sh` | Warns at 80%, critical at 90% |

TLS renewal (`certbot renew`) is installed by `server-setup.sh` at 03:00 UTC
as root — not duplicated here.

Backup files: `/home/deploy/backups/theestate-<timestamp>.dump` (pg_dump
custom format, `0600` perms). Default retention: 7 days; override with
`KEEP=14 ./scripts/backup.sh`.

Restore:

```bash
BACKUP_FILE=/home/deploy/backups/theestate-20260421-020000.dump
docker compose -f compose.prod.yaml exec -T postgres \
  pg_restore -U postgres --clean --if-exists -d theestate < "${BACKUP_FILE}"
```

### TLS cert renewal

Daily at 03:00 UTC by the root cron `server-setup.sh` installed. Force
manually:

```bash
sudo certbot renew --force-renewal \
  --webroot -w /var/www/certbot \
  -d hideawayseoul.com -d www.hideawayseoul.com
docker compose -f /home/deploy/thehideaway/compose.prod.yaml exec nginx nginx -s reload
```

Dry-run check (verifies the cron will succeed when it next runs):

```bash
sudo certbot renew --dry-run
```

### Operational commands

```bash
# Logs
docker compose -f compose.prod.yaml logs -f
docker compose -f compose.prod.yaml logs -f payload    # single service

# Health
curl -s https://hideawayseoul.com/api/health           # {"ok":true}

# Stack status
docker compose -f compose.prod.yaml ps

# Restart one service
docker compose -f compose.prod.yaml restart payload

# Validate then reload nginx config (after editing nginx/sites-enabled/production.conf)
docker compose -f compose.prod.yaml exec nginx nginx -t
docker compose -f compose.prod.yaml exec nginx nginx -s reload

# Prune old images (after several deploys)
docker image prune -a --filter "until=168h"
```

### Server hardening details

See `readmes/SERVER_HARDENING.md` for the full asset manifest, Dockge access,
UFW + Docker bypass details, and `fail2ban` config.

---

## § 5 — Recovery patterns

| Symptom | Action |
|---|---|
| Wrapper Phase 3 (DNS) | Wait 5 min, re-run with `--skip-setup`. Or `--skip-dns` if you verified manually. |
| Wrapper Phase 4 (cert) | Check `:80` is free; check rate-limits at <https://crt.sh/?q=hideawayseoul.com>. Re-run with `--skip-setup --skip-dns`. |
| Wrapper Phase 5a (deploy key) | Recheck the pasted pubkey at <https://github.com/xnxchoi/thehideaway/settings/keys>. Re-run with `--skip-setup --skip-dns --skip-cert`. |
| Wrapper Phase 5b (ghcr.io login) | PAT lacks `read:packages`, or wrong `--ghcr-user`. Regenerate at <https://github.com/settings/tokens?type=beta>, re-run with `--skip-setup --skip-dns --skip-cert --skip-gh-key`. |
| Wrapper Phase 7 (manifest 401) | PAT doesn't have explicit access to the specific package. Go to `github.com/users/xnxchoi/packages/container/hideaway[-migrate]/settings` → Manage installed → add PAT. |
| Wrapper Phase 7 (manifest 404) | The tag isn't on ghcr.io yet. Check <https://github.com/xnxchoi/thehideaway/actions> for a green run. |
| Wrapper Phase 7 (env/assets) | `.env.production` still has placeholders, or asset tree is empty. Fix, re-run with all skip flags up to `--skip-ghcr`. |
| Wrapper Phase 8 (deploy) | `docker compose logs` for the failing service. Most common: `DATABASE_URI` wrong in `.env.production`. |
| Production sign-in returns 500 | Check `docker compose logs payload`. Most common: missing `BETTER_AUTH_SECRET` or wrong `COOKIE_DOMAIN`. |
| OAuth `redirect_uri_mismatch` | Callback URL not registered or has typo. See `oauth-approval/03-pre-flight.md` §4. |
| Subsequent deploy fails at `docker pull` | PAT expired or revoked. Rotate: `echo $NEW_PAT \| sudo -u deploy docker login ghcr.io -u xnxchoi --password-stdin`. |
| Container restart loop | `docker compose logs --tail=100 payload`. Usually a startup env-var crash — `PAYLOAD_SECRET`/`DATABASE_URI` malformed. |
| 502 from nginx | Payload container not responding. `docker compose ps`; if `payload` keeps restarting, check DB connectivity with `docker compose exec postgres pg_isready -U postgres -d theestate`. |
| Disk full | `bash scripts/disk-check.sh`, then `docker image prune -a --filter "until=168h"` and check `ls -lh /home/deploy/backups/`. |

---

## § 6 — After launch (within 48h)

- [ ] Raise DNS TTL on both A records back to `3600` once the IP is stable.
- [ ] Schedule the first backup verification:
      `ssh deploy@... ./scripts/backup.sh` then verify the dump is non-empty
      and pg_restore-able into a scratch database.
- [ ] Set up an offsite copy of `/home/deploy/backups/` (rclone → S3/R2/B2).
      `pgdata` and backups currently live on the same 100 GB HDD; single
      disk failure loses both.
- [ ] Calendar reminder: rotate the ghcr.io PAT 7 days before its expiry.
      Rotate: regenerate at <https://github.com/settings/tokens?type=beta>,
      then on the VPS:
      `echo $NEW_PAT | sudo -u deploy docker login ghcr.io -u xnxchoi --password-stdin`.
- [ ] Subscribe `concierge@hideawayseoul.com` and `hideawayseoul@gmail.com`
      to inbox monitoring (these are the addresses on the OAuth consoles
      and the privacy/terms pages — Naver reviewers occasionally email
      `concierge@`).
