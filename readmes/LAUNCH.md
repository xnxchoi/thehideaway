# Launch day — top-to-bottom checklist

The canonical "follow this in order to go from empty VPS to live production"
runbook. Every other deploy-related doc fills in detail; this one is the
sequencing.

Estimated time end-to-end: **60 minutes** of attention, plus ~24h of wait
time for OAuth console review (Naver) and DNS propagation if it's slow.

## Mental model — the `deploy` branch + ghcr.io flow

Deployment is driven by two branches and one registry:

- **`main`** is active development. Full codebase, dev-only routes, drafts.
- **`deploy`** is the lean, production-buildable branch. Identical to `main`
  except for `.dockerignore` — which excludes the not-prod-ready paths.
- **GitHub Actions** (`.github/workflows/deploy.yml`) fires on every push to
  `deploy`, builds the production image, and publishes it to
  `ghcr.io/xnxchoi/hideaway:<sha>` and `:latest`.
- **The VPS** pulls from ghcr.io. It never builds anything itself.

Accepting new work from `main` into a deploy:

```bash
bash scripts/sync-from-main.sh        # local: merge main → deploy, push
                                       # GitHub Actions builds the image
ssh deploy@hideawayseoul.com
cd thehideaway && ./scripts/redeploy.sh   # VPS: pull + recreate
```

That's the steady state. Everything below is the *first* deploy onto a
fresh VPS, which needs more setup.

---

## T-minus prep (before you SSH into anything)

Have these in hand before opening any terminal session — interrupting the
sequence later to chase a missing credential is the biggest source of wasted
launch-day time.

### Accounts + credentials

- [ ] **GitHub** access to `xnxchoi/thehideaway` (private repo)
- [ ] **Google Cloud Console** signed in as `hideawayseoul@gmail.com`
- [ ] **Naver Developers** signed in to the Naver ID that owns the app
- [ ] **Brevo** SMTP credentials at hand (from `app.brevo.com/settings/keys/smtp`)
- [ ] **Mapbox** access token (`account.mapbox.com/access-tokens`)
- [ ] **ITEasy** VPS provisioned, root SSH confirmed, public IP noted
- [ ] **DNS provider** access to set the A record for `hideawayseoul.com`

### Local machine

- [ ] `pnpm` installed (`corepack prepare pnpm@10.33.0 --activate`)
- [ ] Repo cloned (`main` + `deploy` branches both fetched)
- [ ] SSH keypair for the deploy user (`ssh-keygen -t ed25519 -f ~/.ssh/hideaway_deploy`)
- [ ] `.env.production` filled in real values (work from `.env.production.example`)
- [ ] `public/assets/{plate,rp_plaque,three}/` populated locally (~432 MB)

### GitHub side

- [ ] `deploy` branch exists on `xnxchoi/thehideaway`. If not:
      `git checkout -b deploy && git push -u origin deploy`
- [ ] **GitHub repo secret `ENV_PRODUCTION_B64`** set to the base64-encoded
      `.env.production`. The workflow needs it to bake `NEXT_PUBLIC_*` at
      build time. Generate with `base64 -i .env.production | pbcopy` (macOS)
      or `base64 -w0 .env.production` (Linux), paste at
      <https://github.com/xnxchoi/thehideaway/settings/secrets/actions>.
- [ ] Fine-grained PAT created at <https://github.com/settings/tokens?type=beta>
      with **read:packages** scope, expires no sooner than 90 days. Save it —
      the wrapper needs it as `--ghcr-pat`.
- [ ] First image already published to ghcr.io. Either:
      • Push to `deploy` once and wait for the Actions run to go green, or
      • Trigger the workflow manually from the Actions tab (Run workflow).
      Verify at <https://github.com/xnxchoi?tab=packages>.
- [ ] **Package access for the PAT.** Private packages on ghcr.io require
      explicit PAT access — having `read:packages` is not enough on its own.
      Go to <https://github.com/users/xnxchoi/packages/container/hideaway/settings>
      (and the matching `hideaway-migrate` page), scroll to "Manage Actions
      access" / "Manage installed", and grant the PAT read access. Without
      this, the VPS `docker pull` will return `denied`.

If anything above is missing, fix it before continuing.

---

## The sequence

### Step 1 — Publish the production image via CI

```bash
cd /local/path/to/thehideaway
git checkout deploy
git pull
bash scripts/sync-from-main.sh        # merges main → deploy and pushes
                                       # (skip if you've already synced)
```

Watch the build at <https://github.com/xnxchoi/thehideaway/actions>. It
takes ~5–8 minutes on a cold cache, ~2–3 minutes thereafter.

**Check:** the run goes green, and the image is visible at
<https://github.com/xnxchoi?tab=packages>. Note the short SHA — you'll
optionally pass it as `--image-tag` to the wrapper, otherwise the wrapper
deploys `:latest`.

### Step 2 — Bootstrap the repo onto the VPS

The wrapper script lives in the repo, so it needs to be on the VPS before
the GitHub auth dance in Phase 5. For a *fresh* box where no `git` is set
up yet, do an initial rsync of the deploy branch from your laptop:

```bash
git checkout deploy
rsync -av --progress \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=public/assets \
  --exclude=public/media \
  --exclude=public/track_media \
  --exclude=public/users \
  --exclude=.env \
  --exclude='.env.*' \
  ./ root@<vps-ip>:/root/thehideaway/
```

The `.env*` exclusions are deliberate — production secrets must never land
under `/root/`. They get `scp`'d directly to `/home/deploy/thehideaway/` in
Step 3 with `chmod 600`.

Phase 6 of the wrapper later swaps this for a proper `git clone` into
`/home/deploy/thehideaway` once SSH auth to GitHub is configured.

**Check:** `ssh root@<vps-ip> 'ls /root/thehideaway/scripts/first-deploy.sh'` succeeds.

### Step 3 — Stage `.env.production` and the asset tree

Phase 7 of the wrapper validates that both are in place. Do this *before*
running the wrapper so Phase 7 passes on the first try.

```bash
# .env.production — into the deploy user's repo path. The clone in Phase 6
# expects an empty dir, but a single .env file is fine because it merges.
ssh deploy@<vps-ip> 'mkdir -p ~/thehideaway && chmod 700 ~/thehideaway'
scp .env.production deploy@<vps-ip>:~/thehideaway/.env.production
ssh deploy@<vps-ip> 'chmod 600 ~/thehideaway/.env.production'

# Asset tree (~432 MB total) — into /opt/thehideaway/assets/
ssh deploy@<vps-ip> 'sudo mkdir -p /opt/thehideaway/assets && sudo chown -R deploy:deploy /opt/thehideaway'
rsync -av --progress ./public/assets/ deploy@<vps-ip>:/opt/thehideaway/assets/
```

**Check:**
```bash
ssh deploy@<vps-ip> 'ls -l ~/thehideaway/.env.production && du -sh /opt/thehideaway/assets/'
```
The env file should be `-rw-------` and the asset tree ~432 MB.

### Step 4 — Set the DNS A record

In your DNS provider's dashboard:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A    | `@` (apex) | `<vps-ip>` | 300 |
| A    | `www`      | `<vps-ip>` | 300 |

Lower TTL (300s = 5min) gives faster propagation now. Raise it to 3600 a
few days after launch.

**Check:** `dig +short A hideawayseoul.com @1.1.1.1` returns `<vps-ip>`.
Propagation is region-dependent; can take anywhere from 30s to ~30 min.
The wrapper polls for ~10 min in Phase 3, so you can start the wrapper
even before DNS has fully propagated.

### Step 5 — Run the wrapper

```bash
ssh root@<vps-ip>
cd /root/thehideaway

bash scripts/first-deploy.sh \
    --deploy-key "$(cat << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... deploy@hideawayseoul.com
EOF
)" \
    --ghcr-user xnxchoi \
    --ghcr-pat  ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

(Paste the full content of `~/.ssh/hideaway_deploy.pub` from your laptop
inside the heredoc. The PAT is the fine-grained `read:packages` token you
generated in T-minus prep.)

The wrapper runs 8 phases. **Phase 5a pauses** with an "ACTION REQUIRED"
box containing a public SSH key. Paste it into:

```
https://github.com/xnxchoi/thehideaway/settings/keys/new
  Title:  hideawayseoul.com — deploy
  Access: Leave 'Allow write access' UNCHECKED
```

Press Enter once added. The wrapper verifies the SSH auth, then
**Phase 5b** logs in to ghcr.io with the PAT (no pause). **Phase 7** then
hits the registry to confirm the image tag exists before attempting deploy.

Optional flags:
- `--image-tag <sha>` — deploy a specific build instead of `:latest`
- `--registry <path>` — override `ghcr.io/xnxchoi/hideaway`
- `--branch <name>` — override `deploy` for the repo clone

**Check:** wrapper prints `✓ First deploy complete.` at the end.

### Step 6 — Recovery if you skipped Step 3

If you ran the wrapper without pre-staging `.env.production` and the asset
tree (Step 3), Phase 7 fails. Place them now:

```bash
scp .env.production deploy@hideawayseoul.com:/home/deploy/thehideaway/.env.production
ssh deploy@hideawayseoul.com chmod 600 /home/deploy/thehideaway/.env.production
rsync -av --progress ./public/assets/ deploy@hideawayseoul.com:/opt/thehideaway/assets/
```

Then re-run the wrapper with skip flags to jump back to Phase 7:

```bash
bash scripts/first-deploy.sh \
    --deploy-key "..." \
    --ghcr-user xnxchoi --ghcr-pat ghp_... \
    --skip-setup --skip-dns --skip-cert --skip-gh-key --skip-ghcr
```

**Check:** `ssh deploy@hideawayseoul.com '/home/deploy/thehideaway/scripts/asset-bootstrap.sh check'` exits 0.

### Step 7 — Smoke test the live site

```bash
# From your laptop
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

### Step 8 — Capture production screenshots for OAuth consoles

Naver review historically rejects dev-mode (`localhost`) captures. Take
fresh ones from production:

```bash
# From your laptop
cd /tmp/hideaway-shots  # the playwright sandbox from earlier
# Edit capture.mjs: change http://localhost:3000 → https://hideawayseoul.com
node capture.mjs
# Output lands in <repo>/readmes/oauth-approval/screenshots/*-prod.png
```

Then in `readmes/oauth-approval/`, swap the dev captures for the prod ones
in your local clone, commit, push. (The consoles let you upload the file
directly from disk — no need to deploy first.)

### Step 9 — Submit OAuth consoles

Follow each walkthrough top-to-bottom. **Submit Google first** — it
typically auto-approves the same day for non-sensitive scopes.

- [ ] `readmes/oauth-approval/01-google-console.md` — phases 1–5
- [ ] `readmes/oauth-approval/02-naver-console.md` — phases 1–3

After Google approves: paste the real `GOOGLE_CLIENT_SECRET` into
`.env.production` on the VPS, then:

```bash
ssh deploy@hideawayseoul.com
cd thehideaway
./scripts/redeploy.sh    # pull :latest, recreate stack (no migrate needed)
```

Repeat for Naver after their email lands (1–3 business days typical).

---

## Verifying the running stack

```bash
ssh deploy@hideawayseoul.com

# Stack health
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs --tail=50 payload

# Asset tree present
./scripts/asset-bootstrap.sh check

# Cert renews cleanly
sudo certbot renew --dry-run

# UFW + Docker bypass closed
sudo iptables -L DOCKER-USER -n | grep -q ufw-user && echo "✓ ufw-docker active"

# fail2ban watching sshd
sudo fail2ban-client status sshd
```

All of the above should pass on a healthy launch.

---

## Recovery patterns

| Symptom | Action |
|---------|--------|
| Wrapper fails at Phase 3 (DNS) | Wait 5 minutes, re-run with `--skip-setup`. Or `--skip-dns` if you've verified manually. |
| Wrapper fails at Phase 4 (cert) | Check `:80` is free; check rate-limits at <https://crt.sh/?q=hideawayseoul.com>. Re-run with `--skip-setup --skip-dns`. |
| Wrapper fails at Phase 5a (deploy key) | Recheck the pasted pubkey at <https://github.com/xnxchoi/thehideaway/settings/keys>. Re-run with `--skip-setup --skip-dns --skip-cert`. |
| Wrapper fails at Phase 5b (ghcr.io login) | PAT lacks `read:packages` scope, or wrong `--ghcr-user`. Regenerate at <https://github.com/settings/tokens?type=beta>, re-run with `--skip-setup --skip-dns --skip-cert --skip-gh-key`. |
| Wrapper fails at Phase 7 (manifest check) | The tag isn't on ghcr.io yet — check <https://github.com/xnxchoi/thehideaway/actions> for a green run. If using `--image-tag <sha>`, make sure it matches a published tag. Re-run with all skip flags up to `--skip-ghcr`. |
| Wrapper fails at Phase 7 (pre-flight env/assets) | `.env.production` still has placeholders, or asset tree is empty. Fix, re-run with `--skip-setup --skip-dns --skip-cert --skip-gh-key --skip-ghcr`. |
| Wrapper fails at Phase 8 (deploy) | `docker compose logs` for the failing service. Most common: ghcr.io pull failed (re-check Phase 5b), or `DATABASE_URI` wrong in `.env.production`. |
| Production sign-in returns 500 | Check `docker compose logs payload`. Most common: missing `BETTER_AUTH_SECRET` or wrong `COOKIE_DOMAIN`. |
| OAuth returns `redirect_uri_mismatch` | Callback URL not registered or has typo. See `oauth-approval/03-pre-flight.md` section 4. |
| Subsequent deploys fail at `docker pull` | PAT expired or revoked. Re-authenticate: `echo $NEW_PAT \| sudo -u deploy docker login ghcr.io -u xnxchoi --password-stdin`. |

---

## Where to look for depth

| Topic | Doc |
|-------|-----|
| The build/publish pipeline | `.github/workflows/deploy.yml` |
| Sync `main → deploy` (laptop) | `scripts/sync-from-main.sh --help` |
| Subsequent deploys (VPS) | `scripts/redeploy.sh --help` |
| What gets excluded from the image | `.dockerignore` (header explains the two-section layout) |
| Server hardening details, asset manifest, Dockge | `readmes/SERVER_HARDENING.md` |
| OAuth consoles step-by-step | `readmes/oauth-approval/` |
| What to do *before* flipping repo visibility public | `readmes/GOING_PUBLIC.md` |
| Docker build + compose details | `readmes/DEPLOYMENT.md` |
| Brevo SMTP setup | `readmes/BREVO_SETUP.md` |
| Subsystem-specific docs (Highlightr, Notifications, tour) | `readmes/HIGHLIGHTR.md`, `NOTIFICATIONS.md`, etc. |

---

## After launch (within 48h)

- [ ] Raise DNS TTL on the A records back to `3600` once you're confident
      the IP isn't moving.
- [ ] Schedule the first backup verification: `ssh deploy@... ./scripts/backup.sh` then verify the dump is non-empty and pg_restore-able.
- [ ] Set up an offsite copy of `/home/deploy/backups/` (rclone → S3/R2/B2).
      Both pgdata and the backups live on the same 100 GB HDD today —
      single disk failure currently loses both.
- [ ] Calendar reminder: rotate the ghcr.io PAT 7 days before its expiry.
      To rotate: regenerate the token at
      <https://github.com/settings/tokens?type=beta>, then on the VPS:
      `echo $NEW_PAT | sudo -u deploy docker login ghcr.io -u xnxchoi --password-stdin`.
- [ ] Subscribe `concierge@hideawayseoul.com` and `hideawayseoul@gmail.com`
      to inbox monitoring (these are the addresses on the OAuth consoles
      and the privacy/terms pages — Naver reviewers test-email
      `concierge@` occasionally).
