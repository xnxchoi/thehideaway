# Launch day — top-to-bottom checklist

The canonical "follow this in order to go from empty VPS to live production"
runbook. Every other deploy-related doc fills in detail; this one is the
sequencing.

Estimated time end-to-end: **90 minutes** of attention, plus ~24h of wait
time for OAuth console review (Naver) and DNS propagation if it's slow.

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

- [ ] Docker Desktop running (you'll build the image)
- [ ] `pnpm` installed (`corepack prepare pnpm@10.33.0 --activate`)
- [ ] Repo cloned and `pnpm install` succeeds
- [ ] SSH keypair for the deploy user (`ssh-keygen -t ed25519 -f ~/.ssh/hideaway_deploy`)
- [ ] `.env.production` filled in real values (work from `.env.production.example`)
- [ ] `public/assets/{plate,rp_plaque,three}/` populated locally (~432 MB)

If anything above is missing, fix it before continuing.

---

## The sequence

### Step 1 — Build the production image (local)

```bash
cd /local/path/to/thehideaway
git checkout main
git pull
SHA="$(git rev-parse --short HEAD)"
echo "Image tag: ${SHA}"

pnpm install --frozen-lockfile
pnpm build
docker build -f pack.Dockerfile -t hideaway:${SHA} .
```

**Check:** `docker images | grep hideaway:${SHA}` returns a row.

### Step 2 — Ship the image to the VPS

Easiest path for a first deploy (no registry account needed):

```bash
docker save hideaway:${SHA} | gzip | \
  ssh root@<vps-ip> 'gunzip | docker load'
```

On a 100 Mbit/s uplink this is ~3 minutes. Image is ~200 MB compressed.

**Check:** `ssh root@<vps-ip> 'docker images | grep hideaway:'${SHA}` returns a row on the VPS.

### Step 3 — Get the repo onto the VPS

The wrapper script lives in the repo, so it needs to be there before
GitHub auth is set up (Phase 5 of the wrapper handles that). Easiest:

```bash
rsync -av --progress \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=public/assets \
  ./ root@<vps-ip>:/root/thehideaway/
```

(Excluding `public/assets` because we'll rsync those separately to a
different location.)

**Check:** `ssh root@<vps-ip> 'ls /root/thehideaway/scripts/first-deploy.sh'` succeeds.

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
    --image-tag <SHA-from-step-1>
```

(Paste the full content of `~/.ssh/hideaway_deploy.pub` from your laptop
inside the heredoc on the line where the ssh-ed25519 placeholder is.)

The wrapper runs 8 phases. **Phase 5 will pause** with a "ACTION REQUIRED"
box containing a public SSH key. Paste that key into:

```
https://github.com/xnxchoi/thehideaway/settings/keys/new
  Title:  hideawayseoul.com — deploy
  Access: Leave 'Allow write access' UNCHECKED
```

Press Enter in the SSH session once added. The wrapper verifies the auth
and continues.

**Check:** wrapper prints `✓ First deploy complete.` at the end.

### Step 6 — Pre-flight on `.env.production` + assets

The wrapper's Phase 7 already validates these, but two things you have to
have placed *before* Phase 7 runs:

```bash
# .env.production (from your laptop, with real values)
scp .env.production deploy@hideawayseoul.com:/home/deploy/thehideaway/.env.production
ssh deploy@hideawayseoul.com chmod 600 /home/deploy/thehideaway/.env.production

# Asset tree (~432 MB total)
rsync -av --progress ./public/assets/ deploy@hideawayseoul.com:/opt/thehideaway/assets/
```

If you ran Step 5 first and it failed at Phase 7, do these two things and
re-run with skip flags:

```bash
bash scripts/first-deploy.sh \
    --deploy-key "..." --image-tag <SHA> \
    --skip-setup --skip-dns --skip-cert --skip-gh-key
```

The wrapper will pick up at Phase 7.

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
./prod.sh    # re-deploy with the new env (no migrate needed)
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
| Wrapper fails at Phase 5 (GitHub) | Recheck the pasted pubkey at <https://github.com/xnxchoi/thehideaway/settings/keys>. Re-run with `--skip-setup --skip-dns --skip-cert`. |
| Wrapper fails at Phase 7 (pre-flight) | `.env.production` still has placeholders, or asset tree is empty. Fix, re-run with `--skip-setup --skip-dns --skip-cert --skip-gh-key`. |
| Wrapper fails at Phase 8 (deploy) | `docker compose logs` for the failing service. Most common: image not present locally (re-run Step 2) or DATABASE_URI wrong in `.env.production`. |
| Production sign-in returns 500 | Check `docker compose logs payload`. Most common: missing `BETTER_AUTH_SECRET` or wrong `COOKIE_DOMAIN`. |
| OAuth returns `redirect_uri_mismatch` | Callback URL not registered or has typo. See `oauth-approval/03-pre-flight.md` section 4. |

---

## Where to look for depth

| Topic | Doc |
|-------|-----|
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
- [ ] Decide on registry strategy if you didn't already (ghcr.io recommended
      — same GitHub auth, free for private repos, removes the
      `docker save | ssh | docker load` step for future deploys).
- [ ] Subscribe `concierge@hideawayseoul.com` and `hideawayseoul@gmail.com`
      to inbox monitoring (these are the addresses on the OAuth consoles
      and the privacy/terms pages — Naver reviewers test-email
      `concierge@` occasionally).
