# Deploy — hideawayseoul.com + lostinseoul.com

Canonical deploy reference. The scripts in `scripts/` are authoritative for
what actually runs; this doc orients you and explains the _why_.

```
LAPTOP                          GITHUB ACTIONS               GHCR                       VPS
──────                          ──────────────               ────                       ───
pnpm release:cut ──────────────► release workflow ─────────►  hideaway:vX.Y.Z             ./scripts/deploy.sh vX.Y.Z
  └─ tag + push                   build + push                hideaway-migrate:vX.Y.Z    └─ pull + rotate + smoke
                                                                                          └─ auto-rollback on fail
```

Three boundaries, each crossed by exactly one script:

1. **Laptop → GitHub** — `pnpm release:cut` (version plan, validation gates, package version sync, semver tag, push).
2. **GitHub → GHCR** — `.github/workflows/release.yml` (triggered by the tag).
3. **GHCR → VPS** — `./scripts/deploy.sh vX.Y.Z` (pull, rotate, smoke-test, persist tag).

### Versioning convention

Release tags are the source of truth. Routine cuts derive the next patch from
the highest stable semver tag on `origin`, then synchronize `package.json` to
that planned version before creating the annotated tag.

```bash
pnpm release:cut              # next patch after the latest stable vX.Y.Z tag
pnpm release:cut minor        # next minor
pnpm release:cut major        # next major
pnpm release:cut 34.0.0-rc.1  # exact prerelease / override
```

`package.json` follows the tag plan; it is not the release clock. If it drifts
from the latest tag, `release:cut` reports the drift and, on a real cut,
commits `chore(release): vX.Y.Z` before pushing `main` and the tag together.
`pnpm release:check [target]` is read-only for release metadata: it reads origin
tags, prints the planned version, warns about dirty worktrees, and then runs the
same local gates without syncing `package.json`, creating a tag, or pushing.
Those gates can still create normal local build/install artifacts.

---

## § 1 — Scripts index

| Script                           | Run from                              | Purpose                                                                                |
|----------------------------------|---------------------------------------|----------------------------------------------------------------------------------------|
| `pnpm release:cut [target]`      | laptop                                | Plan next version, run gates, sync `package.json`, signed git tag + push. Triggers CI. |
| `pnpm release:check [target]`    | laptop                                | Same gates as `release:cut` but read-only; no package write, tag, or push.             |
| `pnpm env:edit`                  | laptop                                | Open `.env.production.enc` in `$EDITOR` via sops. Re-encrypts on save.                 |
| `pnpm sync:deploy-rules`         | laptop                                | Regenerate `.dockerignore` / `.deployignore` from `deploy-manifest.json`.              |
| `pnpm env:template:gen`          | laptop                                | Regenerate `.env.production.template` from `src/lib/env.ts`.                           |
| `pnpm verify:env [path]`         | laptop / CI                           | Validate any `.env` file against the Zod schema.                                       |
| `.github/workflows/release.yml`  | GitHub Actions                        | On tag push: decrypt env, run gates, build, push to GHCR.                              |
| `./scripts/deploy.sh <tag>`      | VPS (deploy)                          | Pull a tag from GHCR, rotate, smoke-test, persist tag.                                 |
| `./scripts/deploy.sh --rollback` | VPS (deploy)                          | Roll back to the previously-deployed tag.                                              |
| `./scripts/deploy.sh --status`   | VPS (deploy)                          | Print currently deployed tag + rollback target.                                        |
| `./scripts/first-deploy.sh`      | VPS (root)                            | One-shot first-deploy wrapper (server provisioning + initial deploy).                  |
| `./scripts/server-setup.sh`      | VPS (root, called by first-deploy.sh) | OS hardening, Docker, certbot, deploy user, sops/age binaries.                         |
| `./scripts/backup.sh`            | VPS (deploy, cron)                    | `pg_dump` with 7-day retention.                                                        |

---

## § 2 — Subsequent deploys (the 99% case)

```bash
# Laptop — plan next patch, sync package version, tag + push (triggers CI)
pnpm release:cut

# For intentional jumps or prereleases, pass an explicit target:
pnpm release:cut 33.1.0
pnpm release:cut 34.0.0-rc.1

# Watch CI: https://github.com/xnxchoi/thehideaway/actions
# When the run goes green (~5–8 min cold cache, ~2–3 min thereafter):

# VPS — pull and rotate
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh vX.Y.Z'

# If the deploy also requires migrations:
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh vX.Y.Z --migrate'
```

`deploy.sh` does:

1. Confirm `ghcr.io/xnxchoi/hideaway:vX.Y.Z` exists (manifest check).
2. Decrypt `.env.production.enc` via sops.
3. `docker compose pull` then `up -d --wait` — compose keeps the old container alive until the new one passes its healthcheck. Zero downtime.
4. Smoke test: `GET https://hideawayseoul.com/api/health`, `https://lostinseoul.com/api/health`, and `https://www.lostinseoul.com/api/health` → expect 200 after redirects, max 60s each.
5. **On smoke-test failure**, automatically roll back to the previously-deployed tag.
6. Persist the new tag to `/var/lib/hideaway/current-tag`.
7. With `--migrate`: pg_dump backup → `--profile migrate` → migrations.

### Rollback

```bash
# Roll back to whatever was deployed before the current one
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh --rollback'

# Or deploy a specific older tag
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh v1.2.2'
```

### Status

```bash
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh --status'
# → currently deployed: v0.15.0
# → rollback target:    v1.2.2
```

---

## § 3 — Secrets — sops + age

Production env values live encrypted in `.env.production.enc` (committed to
git, per-value sops/dotenv format). The matching age private key lives in
three places:

| Where                                                  | Purpose                     |
| ------------------------------------------------------ | --------------------------- |
| `~/.config/sops/age/keys.txt` (mode 600) on the laptop | Daily-use working copy      |
| Apple Passwords (secure note)                          | Recovery backup             |
| `/etc/age/keys.txt` (mode 640, root:deploy) on the VPS | Decrypt at deploy time      |
| GitHub Actions secret `SOPS_AGE_KEY`                   | CI decrypt for `pnpm build` |

### Edit a value

```bash
pnpm env:edit
# → opens .env.production.enc in $EDITOR with the values decrypted in-place
# → save & quit re-encrypts; git diff shows which keys changed
git add .env.production.enc
git commit -m "rotate google oauth secret"
```

### Add or remove a variable

```bash
# 1. Edit src/lib/env.ts to add/remove the entry (with .describe() annotation)
# 2. Regenerate the template
pnpm env:template:gen
# 3. Add the real value to the encrypted file
pnpm env:edit
# 4. Commit both files together
git add src/lib/env.ts .env.production.template .env.production.enc
git commit -m "add MAPBOX_API_KEY"
```

### Bootstrap a new dev box

```bash
# 1. Install tools
brew install sops age

# 2. Restore the age private key from Apple Passwords
mkdir -p ~/.config/sops/age
$EDITOR ~/.config/sops/age/keys.txt   # paste the saved block
chmod 600 ~/.config/sops/age/keys.txt

# 3. Clone the repo and verify decrypt works
git clone git@github.com:xnxchoi/thehideaway.git
cd thehideaway && pnpm env:decrypt | head -5
```

### Rotate the age keypair

```bash
# 1. Generate a new keypair on the laptop
age-keygen -o ~/.config/sops/age/keys.new.txt

# 2. Edit .sops.yaml — replace the `age:` field with the new public key.

# 3. Re-encrypt to the new recipient (does NOT touch values)
sops updatekeys .env.production.enc

# 4. Swap the keys on disk and push
mv ~/.config/sops/age/keys.txt   ~/.config/sops/age/keys.old.txt
mv ~/.config/sops/age/keys.new.txt ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
git add .sops.yaml .env.production.enc && git commit && git push

# 5. Update the VPS and CI:
scp ~/.config/sops/age/keys.txt root@hideawayseoul.com:/etc/age/keys.txt
ssh root@hideawayseoul.com 'chown root:deploy /etc/age/keys.txt && chmod 640 /etc/age/keys.txt'
# CI: paste keys.txt content into https://github.com/xnxchoi/thehideaway/settings/secrets/actions
#     under the secret name SOPS_AGE_KEY.

# 6. Update Apple Passwords with the new key.
```

---

## § 4 — First-time VPS initialization

### T-minus — gather everything before opening a terminal

> Interrupting the sequence to chase a missing credential is the single biggest source of wasted launch time. Have every item below confirmed before you start Step 1.

#### Accounts + credentials

- [ ] **GitHub** — access to `xnxchoi/thehideaway`, signed in
- [ ] **Google Cloud Console** — project owner access confirmed
- [ ] **Naver Developers** — signed in to the app's owning Naver ID
- [ ] **Kakao Developers** — signed in to the app's owning Kakao account
- [ ] **Brevo** SMTP credentials (`app.brevo.com/settings/keys/smtp`)
- [ ] **Mapbox** access token (`account.mapbox.com/access-tokens`)
- [ ] **ITEASY** VPS provisioned, root SSH confirmed, public IP noted (`58.229.253.225` / `rp.hideawayseoul.com`)
- [ ] **DNS provider** — access to set A record for `hideawayseoul.com`

#### Local machine

- [ ] `git` with `main` checked out and clean
- [ ] `~/.ssh/hideaway_deploy` SSH keypair generated: `ssh-keygen -t ed25519 -f ~/.ssh/hideaway_deploy`
- [ ] `~/.config/sops/age/keys.txt` — age private key present (mode 600)
- [ ] `public/assets/{plate,rp_plaque,three}/` populated locally (~432 MB)

> Docker Desktop is **not** required — CI builds the image; the VPS pulls it.

#### GitHub side (walked through in Step 1)

- [ ] `deploy` branch exists on `xnxchoi/thehideaway`
- [ ] `SOPS_AGE_KEY` Actions secret set (from `~/.config/sops/age/keys.txt`)
- [ ] **Classic** PAT with `read:packages` scope created
- [ ] PAT has explicit access to the `hideaway` + `hideaway-migrate` packages

---

### Step 1 — GHCR prerequisites (do this on the laptop)

**1a. Create the `deploy` branch.**

```bash
git checkout main && git pull
git checkout -b deploy
git push -u origin deploy
```

**1b. Set the `SOPS_AGE_KEY` Actions secret.** CI needs the age private key to
decrypt `.env.production.enc` when building the Docker image.

```bash
# macOS:
pbcopy < ~/.config/sops/age/keys.txt
```

Paste at [Settings → Secrets → Actions][1] → **New repository secret** →
name `SOPS_AGE_KEY`.

**1c. Create a classic PAT** for pulling images on the VPS.

> **CRITICAL: Use a classic token, NOT a fine-grained token.** Fine-grained
> PATs cannot read GitHub Packages (the API does not support them yet). Using
> one produces a `denied: denied` error even with the correct scope selected.

Go to [github.com/settings/tokens][2] → **Generate new token (classic)**:

| Field      | Value                                  |
| ---------- | -------------------------------------- |
| Note       | `hideawayseoul.com — ghcr.io pull`     |
| Expiration | 90 days (calendar a rotation reminder) |
| Scope      | `read:packages`                        |

Copy the token (`ghp_...`). **It only displays once.** Store it somewhere you
can paste it in Step 5 — do NOT keep it in shell history or a world-readable
file.

**1d. Trigger the first CI build.** Push a commit on the `deploy` branch:

```bash
git checkout deploy
git merge main --ff-only
git push
```

Watch the workflow at [github.com/xnxchoi/thehideaway/actions][3].
~5–8 min cold cache. On success it publishes:

- `ghcr.io/xnxchoi/hideaway:<sha>` + `:latest`
- `ghcr.io/xnxchoi/hideaway-migrate:<sha>` + `:latest`

Verify at [github.com/xnxchoi?tab=packages][4].

**1e. Grant the PAT explicit package access.** Private packages on ghcr.io
require per-package access — `read:packages` scope alone is not enough.

For each package, go to its **Settings → Manage Actions access**, then add
your GitHub user (the one who owns the classic PAT) with **Read** access:

- [hideaway package settings][5]
- [hideaway-migrate package settings][6]

> Skipping this step produces `denied: denied` at `docker pull` on the VPS
> even with a valid PAT. It is the most common first-launch failure.

---

### Step 2 — Bootstrap the repo onto the VPS

The wrapper scripts live in the repo, so they must be on the VPS before
GitHub auth is configured for the deploy user. Rsync directly using your root
SSH key — do not use `sync-repo-to-vps.sh` with extra `-e` flags (it rejects
unknown arguments):

```bash
# From the repo root, on your laptop:

# 0. Clear the stale host key if you reset the VPS
ssh-keygen -R rp.hideawayseoul.com
ssh-keygen -R 58.229.253.225
ssh-keyscan -H rp.hideawayseoul.com >> ~/.ssh/known_hosts

# 1. Dry-run: scan for anything that shouldn't transfer
rsync -av --dry-run --progress \
  -e "ssh -i ~/.ssh/hideaway_deploy" \
  --exclude-from=".deployignore" \
  . root@rp.hideawayseoul.com:/root/thehideaway/

# 2. Sync for real when the dry-run looks clean
rsync -av --progress \
  -e "ssh -i ~/.ssh/hideaway_deploy" \
  --exclude-from=".deployignore" \
  . root@rp.hideawayseoul.com:/root/thehideaway/
```

**Verify:**

```bash
ssh -i ~/.ssh/hideaway_deploy root@rp.hideawayseoul.com \
  'du -sh /root/thehideaway && ls /root/thehideaway/scripts/first-deploy.sh'
```

Expect a few tens of MB (assets are excluded by `.deployignore`) and the path
to exist.

---

### Step 3 — Stage the age private key

Phase 7 of the wrapper checks that `/etc/age/keys.txt` exists. Stage it now so
the wrapper doesn't abort at pre-flight.

> **Ordering matters.** This step runs _before_ the wrapper, and the `deploy`
> user/group does not exist yet — `server-setup.sh` creates it in Phase 2 of
> Step 6. So stage the key as `root:root 600` here. `server-setup.sh` (Phase 2)
> and `first-deploy.sh` Phase 7.1 both detect the pre-staged file and promote
> it to its resting state of `root:deploy 640` once the `deploy` group exists.
> Do **not** try to `chown root:deploy` at this point — it will fail with
> `invalid group 'deploy'`.

```bash
# From your laptop:

# Copy the key to a temp location
scp -i ~/.ssh/hideaway_deploy \
  ~/.config/sops/age/keys.txt \
  root@rp.hideawayseoul.com:/tmp/age_key

# On the VPS: move it into place as root:root 600. `bash -s` + `set -euo
# pipefail` makes the remote block abort loudly on the first failure instead
# of printing a false "✓" after a broken step.
ssh -i ~/.ssh/hideaway_deploy root@rp.hideawayseoul.com 'bash -s' << 'EOF'
set -euo pipefail
install -o root -g root -m 0700 -d /etc/age
mv /tmp/age_key /etc/age/keys.txt
chmod 600 /etc/age/keys.txt
echo "✓ age key staged at /etc/age/keys.txt (root:root 600)"
EOF
```

After Step 6 has run, the key ends up `root:deploy 640` and the directory
`root:deploy 0750`, so the `deploy` user inherits read access via the `deploy`
group. Until then, only root can read it — which is correct, since nothing
else needs it before `server-setup.sh` runs.

---

### Step 4 — Stage the asset tree

`server-setup.sh` creates the asset directories. The assets themselves
(~432 MB) are never committed to git — rsync them from your laptop now.
Phase 7.5 of the wrapper aborts if the tree is empty:

```bash
# server-setup.sh runs as part of the wrapper (Step 5), but you can
# pre-create the asset dirs now to unblock the rsync:
ssh -i ~/.ssh/hideaway_deploy root@rp.hideawayseoul.com \
  'mkdir -p /opt/thehideaway/assets && chown -R root:root /opt/thehideaway'

# Rsync from your laptop (as deploy if server-setup has run, or as root now)
rsync -av --progress \
  -e "ssh -i ~/.ssh/hideaway_deploy" \
  ./public/assets/ \
  root@rp.hideawayseoul.com:/opt/thehideaway/assets/
```

---

### Step 5 — Set the DNS A record

In your DNS provider's dashboard:

| Type | Name       | Value            | TTL |
| ---- | ---------- | ---------------- | --- |
| A    | `@` (apex) | `58.229.253.225` | 300 |
| A    | `www`      | `58.229.253.225` | 300 |

Repeat the same records for the LOSTINSEOUL zone:

| Type | Name       | Value            | TTL |
| ---- | ---------- | ---------------- | --- |
| A    | `@` (apex) | `58.229.253.225` | 300 |
| A    | `www`      | `58.229.253.225` | 300 |

300 s TTL for faster propagation now. Raise to 3600 after a few days.

**Check:**

```bash
dig +short A hideawayseoul.com @1.1.1.1
dig +short A lostinseoul.com @1.1.1.1
dig +short A www.lostinseoul.com @1.1.1.1
```

Should return `58.229.253.225`. Propagation: 30 s to ~30 min. The wrapper
polls for ~10 min in Phase 3, so you can start Step 6 before DNS fully
propagates.

### Step 5b — Expand TLS for LOSTINSEOUL on an existing VPS

The production compose stack mounts the `hideawayseoul.com` Let's Encrypt
lineage into Nginx. When adding `lostinseoul.com` to the same server, expand
that existing certificate so one mounted cert covers all four hostnames:

```bash
ssh deploy@hideawayseoul.com 'cd thehideaway && docker compose -f compose.prod.yaml exec nginx nginx -t'

ssh root@hideawayseoul.com 'certbot certonly --webroot -w /var/www/certbot \
  --cert-name hideawayseoul.com --expand \
  -d hideawayseoul.com -d www.hideawayseoul.com \
  -d lostinseoul.com -d www.lostinseoul.com \
  --deploy-hook /usr/local/bin/certbot-reload-nginx'

ssh deploy@hideawayseoul.com 'cd thehideaway && docker compose -f compose.prod.yaml exec nginx nginx -t && docker compose -f compose.prod.yaml exec nginx nginx -s reload'
```

Then verify from the laptop:

```bash
curl -I https://lostinseoul.com/api/health
curl -I https://www.lostinseoul.com/api/health
curl -I https://lostinseoul.com/
```

Expected: health returns `200`; `www.lostinseoul.com` may redirect to
`lostinseoul.com`, but `curl -L` should end at `200`.

---

### Step 6 — Run the wrapper

SSH into the VPS as root and run `first-deploy.sh`. The PAT is passed via
`GHCR_TOKEN` — **never** as a CLI flag, because CLI args are visible in
`ps aux` for the duration of the script (which includes a 10-min DNS poll).

```bash
# On the VPS, as root:
ssh -i ~/.ssh/hideaway_deploy root@rp.hideawayseoul.com

cd /root/thehideaway

# Write the PAT to a mode-600 file; read it inline; shred it after.
echo "<GHCR_CLASSIC_PAT>" > ~/.ghcr-token
chmod 600 ~/.ghcr-token

GHCR_TOKEN="$(cat ~/.ghcr-token)" \
  bash scripts/first-deploy.sh \
    --deploy-key "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB1JzXWlD3H5JwEzI7zPd+SEZN3aHQC0RUQWKCw5bsDJ seanschoi@Seans-MacBook-Pro.local" \
    --image-tag  v0.15.0 \
    --ghcr-user  xnxchoi \
     --skip-setup \
     --skip-dns \
     --skip-cert

shred -u ~/.ghcr-token   # wipe the token file
```

Replace the `--deploy-key` value with the full content of `~/.ssh/hideaway_deploy.pub` from your laptop.

The wrapper runs 8 phases:

| Phase | Does                                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1/8   | Sanity — confirms root on Ubuntu, server-setup.sh present                                                                                                                                        |
| 2/8   | `server-setup.sh` — OS hardening, Docker, certbot, deploy user, sops + age binaries                                                                                                              |
| 3/8   | DNS poll — waits up to ~10 min for `hideawayseoul.com` to resolve to this machine                                                                                                                |
| 4/8   | `certbot --standalone` — issues TLS cert for `hideawayseoul.com` + `www`                                                                                                                         |
| 5a/8  | **INTERACTIVE** — generates a GitHub deploy key, prints the pubkey, pauses. Paste it at [github.com/xnxchoi/thehideaway/settings/keys/new][7] (Title: `hideawayseoul.com — deploy`, write: OFF). |
| 5b/8  | `docker login ghcr.io` as the deploy user with the PAT                                                                                                                                           |
| 6/8   | `git clone` into `/home/deploy/thehideaway`                                                                                                                                                      |
| 7/8   | Pre-flight: age key present, `.env.production.enc` decrypts cleanly, asset tree populated, image manifest exists on ghcr.io                                                                      |
| 8/8   | `./scripts/deploy.sh <tag> --migrate` (pg_dump backup + migrations + smoke test)                                                                                                                 |

**Check:** wrapper prints `✓ First deploy complete.`

#### Skip flags for re-runs

If the wrapper aborted partway, re-run with flags to skip completed phases:

```bash
GHCR_TOKEN="$(cat ~/.ghcr-token)" \
  bash scripts/first-deploy.sh \
    --deploy-key "..." \
    --image-tag v0.15.0 \
    --ghcr-user xnxchoi \
    --skip-setup   \
    --skip-dns     \
    --skip-cert    \
    --skip-gh-key
```

#### Exit codes

| Code | Meaning                                                      |
| ---- | ------------------------------------------------------------ |
| 0    | Success                                                      |
| 2    | Misuse (missing or invalid flags)                            |
| 3    | Pre-flight failure (age key, env schema, assets, manifest)   |
| 4    | DNS never converged within ~10 min                           |
| 5    | Certbot failed (port 80 in use, rate-limited, DNS not ready) |
| 6    | Deploy or post-deploy health check failed                    |
| 7    | GitHub SSH auth failed after deploy key was added            |

---

### Step 7 — Smoke test

From your laptop:

```bash
for path in / /sign-in /sign-up /privacy /terms; do
  printf "%-12s %s\n" "$path" \
    "$(curl -s -o /dev/null -w '%{http_code}' https://hideawayseoul.com$path)"
done
```

Expected: all `200`.

Open `https://hideawayseoul.com/sign-in` in an incognito window. Confirm:

- [ ] Page renders without console errors
- [ ] Google + Naver + Kakao + Passkey buttons all visible
- [ ] Email/password fields work (try a signup → cancel before submit)
- [ ] Theme + locale toggles work

---

### Step 8 — OAuth consoles

**8a. Capture production screenshots and callback URLs.** Naver and Kakao review
should use production HTTPS captures. Take fresh ones from production:

```bash
BASE_URL=https://hideawayseoul.com pnpm oauth:approval:report
# Output:
#   readmes/oauth-approval/screenshots/*-prod.png
#   readmes/oauth-approval/callbacks.md
```

**8b. Submit the consoles — Google first** (typically auto-approves same day
for non-sensitive scopes):

- [ ] `readmes/oauth-approval/01-google-console.md` — phases 1–5
- [ ] `readmes/oauth-approval/02-naver-console.md` — phases 1–3
- [ ] `readmes/oauth-approval/03-kakao-console.md` — phases 1–5
- [ ] `readmes/oauth-approval/04-pre-flight.md` — run before submission

After Google approves, update the encrypted env on the laptop and deploy:

```bash
pnpm env:edit      # paste the real GOOGLE_CLIENT_SECRET
git add .env.production.enc && git commit -m "add google client secret"
pnpm release:cut 1.2.4
# When CI goes green:
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh v1.2.4'
```

Repeat for Naver and Kakao after their approval emails arrive.

---

## § 5 — Validation gates

Both `pnpm release:cut` and CI run the same four gates:

| Gate                       | Purpose                                                                   | Failure mode                                            |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `pnpm verify:deploy-rules` | `.dockerignore` / `.deployignore` are in sync with `deploy-manifest.json` | Drift → exit 1 with the offending file name             |
| `pnpm env:template:verify` | `.env.production.template` is in sync with `src/lib/env.ts` schema        | Drift → exit 1 with hint to run `pnpm env:template:gen` |
| `pnpm verify:env <file>`   | Decrypted env passes the Zod schema                                       | Lists every missing/malformed key                       |
| Standalone preflight       | `.next/standalone/server.js` and `.next/static` exist after `pnpm build`  | Points at `next.config.ts`'s `output: "standalone"`     |

Each gate exits non-zero on failure, so a misconfigured release never reaches
GHCR. The same gates run in CI against the decrypted env.

---

## § 6 — Backups + scheduled crons

Installed by `bash scripts/cron-setup.sh` (run once on the VPS as `deploy`):

| UTC   | KST   | Script                  | Purpose                        |
| ----- | ----- | ----------------------- | ------------------------------ |
| 17:00 | 02:00 | `scripts/backup.sh`     | `pg_dump` with 7-day retention |
| 23:00 | 08:00 | `scripts/disk-check.sh` | Warns at 80%, critical at 90%  |

TLS renewal (`certbot renew`) is installed by `server-setup.sh` at 03:00 UTC
as root.

### Inventory reservation expiry

Payload schedules `expireInventoryReservations` on the existing `quarterHour`
queue every 15 minutes. Each run examines at most 25 distinct orders. Each order is handled in its own transaction, and
the inventory lock order prevents overlapping workers from expiring or consuming the same reservation twice. Payload
retries a failed task up to three times. Reservation operations are idempotent, so a restarted run can repeat completed
discovery safely.

The expiry task remains scheduled when `LOST_INVENTORY_RESERVATIONS_LIVE` is false. The feature gate prevents new
stocked checkout reservations; it does not strand reservations created before the gate was disabled. With no active
reservations, the task completes without changes.

`CRON_SECRET` bearer access is limited to running jobs. Queue and cancellation operations require an authenticated
admin. To rotate the secret, update the encrypted production environment and every external caller in the same release,
deploy, then confirm the old bearer token is rejected. Payload's internal
`autoRun` schedule does not require the bearer token.

When a run reports failed orders, check server logs for the stable error code and order ID. Do not edit reservation
status or inventory projections directly. Fix the underlying data through a guarded inventory operation, then allow the
next scheduled run to retry. Disabling checkout is a safe rollback; keep the expiry task enabled until all active
reservations have reached a terminal state.

Pre-migration backups are taken automatically by `./scripts/deploy.sh <tag> --migrate`
(written to `/home/deploy/backups/pre-migrate-<ISO>.dump`).

**Restore:**

```bash
BACKUP_FILE=/home/deploy/backups/theestate-20260518T020000Z.dump
docker compose -f compose.prod.yaml exec -T postgres \
  pg_restore -U postgres --clean --if-exists -d theestate < "${BACKUP_FILE}"
```

---

## § 7 — Recovery patterns

| Symptom                                             | Action                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `release:cut` fails at gate 4b (env schema)         | Fix with `pnpm env:edit`; the error names the misconfigured key.                                                                             |
| `release:cut` fails at gate 4 (deploy-rules drift)  | Run `pnpm sync:deploy-rules` and re-commit.                                                                                                  |
| `release:cut` fails at gate 4 (template drift)      | Run `pnpm env:template:gen` and re-commit.                                                                                                   |
| CI fails at "Decrypt .env.production"               | `SOPS_AGE_KEY` secret missing or stale. Recreate from `~/.config/sops/age/keys.txt`.                                                         |
| `deploy.sh` reports `image not found on ghcr.io`    | CI hasn't finished. Check [github.com/xnxchoi/thehideaway/actions][8].                                                                       |
| `deploy.sh` smoke test fails                        | Auto-rollback fires; check `docker compose logs payload`. Most common: `BETTER_AUTH_SECRET` or `COOKIE_DOMAIN` wrong in the encrypted env.   |
| `deploy.sh` reports `age key not found`             | `/etc/age/keys.txt` missing on the VPS. `scp` it from the laptop; then `chown root:deploy /etc/age/keys.txt && chmod 640 /etc/age/keys.txt`. |
| Manual rollback fails (rollback target also broken) | Pick an older tag manually: `./scripts/deploy.sh v1.2.1`.                                                                                    |
| `docker pull` denied on subsequent deploy           | GHCR token expired. Re-run `docker login ghcr.io` as the deploy user with a fresh classic PAT.                                               |
| `sops` decrypt fails after age key rotation         | `/etc/age/keys.txt` on VPS is the old key. `scp` the new one; then `chown root:deploy /etc/age/keys.txt && chmod 640 /etc/age/keys.txt`.     |
| VPS fully locked out (console + SSH)                | ITEASY web console is SSH-backed (not KVM/VNC) and requires root+password. Reset the VPS from the ITEASY dashboard, then re-run § 4.         |

For server-hardening details (Dockge, UFW + Docker bypass, `fail2ban`),
see `readmes/SERVER_HARDENING.md`.

[1]: https://github.com/xnxchoi/thehideaway/settings/secrets/actions
[2]: https://github.com/settings/tokens
[3]: https://github.com/xnxchoi/thehideaway/actions
[4]: https://github.com/xnxchoi?tab=packages
[5]: https://github.com/users/xnxchoi/packages/container/hideaway/settings
[6]: https://github.com/users/xnxchoi/packages/container/hideaway-migrate/settings
[7]: https://github.com/xnxchoi/thehideaway/settings/keys/new
[8]: https://github.com/xnxchoi/thehideaway/actions
