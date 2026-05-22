# Deploy — hideawayseoul.com

Canonical deploy reference. The scripts in `scripts/` are authoritative for
what actually runs; this doc orients you and explains the *why*.

```
LAPTOP                          GITHUB ACTIONS               GHCR                       VPS
──────                          ──────────────               ────                       ───
pnpm release:cut 1.2.3 ───────► release workflow ─────────►  hideaway:v1.2.3            ./scripts/deploy.sh v1.2.3
  └─ tag + push                   build + push                hideaway-migrate:v1.2.3   └─ pull + rotate + smoke
                                                                                          └─ auto-rollback on fail
```

Three boundaries, each crossed by exactly one script:
1. **Laptop → GitHub** — `pnpm release:cut 1.2.3` (validation gates, semver tag, push).
2. **GitHub → GHCR** — `.github/workflows/release.yml` (triggered by the tag).
3. **GHCR → VPS** — `./scripts/deploy.sh v1.2.3` (pull, rotate, smoke-test, persist tag).

---

## § 1 — Scripts index

| Script                           | Run from                              | Purpose                                                                   |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm release:cut <version>`     | laptop                                | Validation gates + signed git tag + push. Triggers CI.                    |
| `pnpm release:check <version>`   | laptop                                | Same gates as `release:cut` but stops before tagging.                     |
| `pnpm env:edit`                  | laptop                                | Open `.env.production.enc` in `$EDITOR` via sops. Re-encrypts on save.    |
| `pnpm sync:deploy-rules`         | laptop                                | Regenerate `.dockerignore` / `.deployignore` from `deploy-manifest.json`. |
| `pnpm env:template:gen`          | laptop                                | Regenerate `.env.production.template` from `src/lib/env.ts`.              |
| `pnpm verify:env [path]`         | laptop / CI                           | Validate any `.env` file against the Zod schema.                          |
| `.github/workflows/release.yml`  | GitHub Actions                        | On tag push: decrypt env, run gates, build, push to GHCR.                 |
| `./scripts/deploy.sh <tag>`      | VPS (deploy)                          | Pull a tag from GHCR, rotate, smoke-test, persist tag.                    |
| `./scripts/deploy.sh --rollback` | VPS (deploy)                          | Roll back to the previously-deployed tag.                                 |
| `./scripts/deploy.sh --status`   | VPS (deploy)                          | Print currently deployed tag + rollback target.                           |
| `./scripts/first-deploy.sh`      | VPS (root)                            | One-shot first-deploy wrapper (server provisioning + initial deploy).     |
| `./scripts/server-setup.sh`      | VPS (root, called by first-deploy.sh) | OS hardening, Docker, certbot, deploy user, sops/age binaries.            |
| `./scripts/backup.sh`            | VPS (deploy, cron)                    | `pg_dump` with 7-day retention.                                           |

---

## § 2 — Subsequent deploys (the 99% case)

```bash
# Laptop — tag + push (triggers CI)
pnpm release:cut 1.2.3

# Watch CI: https://github.com/xnxchoi/thehideaway/actions
# When the run goes green (~5–8 min cold cache, ~2–3 min thereafter):

# VPS — pull and rotate
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh v1.2.3'

# If the deploy also requires migrations:
ssh deploy@hideawayseoul.com 'cd thehideaway && ./scripts/deploy.sh v1.2.3 --migrate'
```

`deploy.sh` does:
1. Confirm `ghcr.io/xnxchoi/hideaway:v1.2.3` exists (manifest check).
2. Decrypt `.env.production.enc` via sops.
3. `docker compose pull` then `up -d --wait` — compose keeps the old container alive until the new one passes its healthcheck. Zero downtime.
4. Smoke test: `GET https://hideawayseoul.com/api/health` → expect 200, max 60s.
5. **On smoke-test failure**, automatically roll back to the previously-deployed tag.
6. Persist the new tag to `/var/lib/hideaway/current-tag`.
7. With `--migrate`: pg\_dump backup → `--profile migrate` → migrations.

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
# → currently deployed: v1.2.3
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
| `/etc/age/keys.txt` (mode 600, root) on the VPS        | Decrypt at deploy time      |
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
ssh root@hideawayseoul.com 'chmod 600 /etc/age/keys.txt'
# CI: paste keys.txt content into https://github.com/xnxchoi/thehideaway/settings/secrets/actions
#     under the secret name SOPS_AGE_KEY.

# 6. Update Apple Passwords with the new key.
```

---

## § 4 — First-time launch (per VPS)

### T-minus prep

> Have these ready before opening any terminal session. Interrupting later to chase a missing credential is the single biggest source of wasted launch time.

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
- [ ] `public/assets/{plate,rp_plaque,three}/` populated locally (\~432 MB)

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

Paste at [https://github.com/xnxchoi/thehideaway/settings/secrets/actions][1] →
**New repository secret** → name `ENV_PRODUCTION_B64`.

**Rotate this secret whenever `.env.production` changes** (new OAuth secret,
new SMTP password, etc.). The workflow refuses to build if the decoded file
still has placeholders (`CHANGE_ME`, `your_`, etc.).

**1c. Create a fine-grained PAT.** Go to
[https://github.com/settings/tokens?type=beta][2] → **Generate new token**:

| Field                               | Value                                   |
| ----------------------------------- | --------------------------------------- |
| Token name                          | `hideawayseoul.com — ghcr.io pull`      |
| Expiration                          | 90 days (calendar a reminder to rotate) |
| Repository access                   | Only `xnxchoi/thehideaway`              |
| Permissions → Repository → Contents | Read-only (for `git clone` later)       |
| Permissions → Account → Packages    | Read-only                               |

Copy the token. **It only displays once.** Save it where you'll find it later
in this runbook.

**1d. Trigger the first CI build.** From your laptop:

```bash
bash scripts/sync-from-main.sh --yes
```

This merges `main` → `deploy` and pushes. Watch the workflow at
[https://github.com/xnxchoi/thehideaway/actions][3]. \~5–8 min cold cache,
\~2–3 min thereafter. On success it publishes:

- `ghcr.io/xnxchoi/hideaway:<sha>` + `:latest`
- `ghcr.io/xnxchoi/hideaway-migrate:<sha>` + `:latest`

Verify at [https://github.com/xnxchoi?tab=packages][4].

**1e. Grant the PAT explicit access to the new packages.** Private packages on
ghcr.io require explicit PAT access — having `read:packages` scope alone is
not enough.

For each of the two packages, go to its settings:

- [https://github.com/users/xnxchoi/packages/container/hideaway/settings][5]
- [https://github.com/users/xnxchoi/packages/container/hideaway-migrate/settings][6]

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

Env file should be `-rw-------`. Asset tree should be \~432 MB.

---

### Step 4 — Set the DNS A record

In your DNS provider's dashboard:

| Type | Name       | Value      | TTL |
| ---- | ---------- | ---------- | --- |
| A    | `@` (apex) | `<vps-ip>` | 300 |
| A    | `www`      | `<vps-ip>` | 300 |

300s TTL gives faster propagation now. Raise to 3600 a few days after launch.

**Check:**

```bash
dig +short A hideawayseoul.com @1.1.1.1
```

Should return `<vps-ip>`. Propagation: 30s to \~30 min depending on region.
The wrapper polls for \~10 min in Phase 3, so you can start the wrapper
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

| Phase | Does                                                                                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1/8   | Sanity — root on Ubuntu, server-setup.sh present                                                                                                                                                  |
| 2/8   | `server-setup.sh` — OS hardening, Docker, certbot, deploy user                                                                                                                                    |
| 3/8   | DNS poll — waits for the A record to point to this machine                                                                                                                                        |
| 4/8   | `certbot --standalone` — issues the TLS cert                                                                                                                                                      |
| 5a/8  | **INTERACTIVE** — prints an ed25519 pubkey, pauses for you to paste it at [https://github.com/xnxchoi/thehideaway/settings/keys/new][7] (Title: hideawayseoul.com — deploy, write access **OFF**) |
| 5b/8  | `docker login ghcr.io` with the PAT                                                                                                                                                               |
| 6/8   | `git clone --branch deploy` into `/home/deploy/thehideaway` (preserves your pre-staged `.env.production`)                                                                                         |
| 7/8   | Pre-flight — validates env, asset tree, image manifests on ghcr.io                                                                                                                                |
| 8/8   | `prod.sh --full` — deploy + backup + migrate, plus a smoke test of `/privacy`                                                                                                                     |

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
Uses `scripts/first-deploy.sh`. It now invokes `scripts/deploy.sh` directly
in Phase 8 (no more `prod.sh` indirection) and validates the encrypted env
via sops + the Zod schema in Phase 7 — same gates the laptop and CI run.

Before running the wrapper, you need:

- The release tag to exist on GHCR (run `pnpm release:cut 1.2.3` on the
  laptop first and wait for CI green).
- A GHCR personal access token with `read:packages` and explicit access to
  the `hideaway` + `hideaway-migrate` packages (see § 1 of the old runbook
  in `.attic/readmes/DEPLOY.md` if you need step-by-step PAT setup —
  the GitHub UI hasn't changed).
- The age private key already scp'd to `/etc/age/keys.txt` (mode 600).
  Phase 10 of `server-setup.sh` warns if it isn't present.

Then on the VPS, as root. \*\*The GHCR PAT is passed via the `GHCR_TOKEN` env
var, NOT as a CLI flag\*\* — CLI flags are visible in `ps aux` for the duration
of the run (which can include a 10-min DNS poll). Stash the PAT in a file
with mode 600 and read it inline:

```bash
echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" > ~/.ghcr-token
chmod 600 ~/.ghcr-token

GHCR_TOKEN="$(cat ~/.ghcr-token)" \
bash scripts/first-deploy.sh \
    --deploy-key "ssh-ed25519 AAAA…" \
    --image-tag v1.2.3 \
    --ghcr-user xnxchoi

shred -u ~/.ghcr-token   # or `rm` on macOS
```

The wrapper does:

1. Sanity (root on Ubuntu, server-setup.sh present).
2. `server-setup.sh` (OS hardening, Docker, certbot, deploy user, /etc/age/, sops + age).
3. DNS poll (waits up to \~10 min for the A record).
4. `certbot --standalone`.
5a. GitHub deploy key (interactive — pause to paste at `/settings/keys/new`).
5b. `docker login ghcr.io` as deploy with the PAT.
6. `git clone --branch deploy` into `/home/deploy/thehideaway`.
7. Pre-flight: age key present + perms, decrypt + schema validation, asset tree, image manifest on GHCR.
8. `./scripts/deploy.sh <tag> --migrate` (handles its own pg\_dump backup), then smoke test.

After the wrapper finishes, all subsequent deploys are just
`./scripts/deploy.sh <tag>` as the deploy user.

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

Pre-migration backups are taken automatically by \`./scripts/deploy.sh
<tag> --migrate`(written to`/home/deploy/backups/pre-migrate-<ISO>.dump\`).

Restore:

```bash
BACKUP_FILE=/home/deploy/backups/theestate-20260518T020000Z.dump
docker compose -f compose.prod.yaml exec -T postgres \
  pg_restore -U postgres --clean --if-exists -d theestate < "${BACKUP_FILE}"
```

---

## § 7 — Recovery patterns

| Symptom                                             | Action                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `release:cut` fails at gate 4b (env schema)         | Fix with `pnpm env:edit`; the error names the misconfigured key.                                                                           |
| `release:cut` fails at gate 4 (deploy-rules drift)  | Run `pnpm sync:deploy-rules` and re-commit.                                                                                                |
| `release:cut` fails at gate 4 (template drift)      | Run `pnpm env:template:gen` and re-commit.                                                                                                 |
| CI fails at "Decrypt .env.production"               | `SOPS_AGE_KEY` secret missing or stale. Recreate from `~/.config/sops/age/keys.txt`.                                                       |
| `deploy.sh` reports `image not found on ghcr.io`    | CI hasn't finished. Check [https://github.com/xnxchoi/thehideaway/actions][8].                                                             |
| `deploy.sh` smoke test fails                        | Auto-rollback fires; check `docker compose logs payload`. Most common: `BETTER_AUTH_SECRET` or `COOKIE_DOMAIN` wrong in the encrypted env. |
| `deploy.sh` reports `age key not found`             | `/etc/age/keys.txt` missing on the VPS. `scp` it from the laptop, chmod 600.                                                               |
| Manual rollback fails (rollback target also broken) | Pick an older tag manually: `./scripts/deploy.sh v1.2.1`.                                                                                  |
| `Subsequent deploy` `docker pull` denied            | GHCR token expired. Re-run `docker login ghcr.io` as deploy user.                                                                          |

For server-hardening details (Dockge, UFW + Docker bypass, `fail2ban`),
see `readmes/SERVER_HARDENING.md`.

[1]:	https://github.com/xnxchoi/thehideaway/settings/secrets/actions
[2]:	https://github.com/settings/tokens?type=beta
[3]:	https://github.com/xnxchoi/thehideaway/actions
[4]:	https://github.com/xnxchoi?tab=packages
[5]:	https://github.com/users/xnxchoi/packages/container/hideaway/settings
[6]:	https://github.com/users/xnxchoi/packages/container/hideaway-migrate/settings
[7]:	https://github.com/xnxchoi/thehideaway/settings/keys/new
[8]:	https://github.com/xnxchoi/thehideaway/actions