# Server hardening — `scripts/server-setup.sh`

Reference for what the provisioning script does, what it hardens, and how to
verify each piece is working. Read this before running it on a fresh VPS, and
again as a checklist after.

---

## What it sets up

12 idempotent sections, in order:

| #  | Section                          | Why                                                    |
|----|----------------------------------|--------------------------------------------------------|
| 1  | apt update + essentials          | base packages: curl, jq, fail2ban, ufw, logrotate      |
| 2  | swap (4 GB)                      | match RAM; cushion for Node heap + Postgres            |
| 3  | sysctl tuning                    | TCP backlog, file descriptors, low swappiness          |
| 4  | sshd hardening                   | pubkey-only, no root, idle timeout                     |
| 5  | UFW + ufw-docker                 | firewall **and** the Docker iptables bypass closure    |
| 6  | Docker CE                        | log rotation, live-restore, overlay2                   |
| 7  | deploy user (scoped sudoers)     | NOPASSWD only for docker / compose / certbot / nginx   |
| 8  | fail2ban sshd jail               | ban brute-force IPs even with pubkey-only              |
| 9  | Certbot + reload helper          | webroot mode, post-hook delegated to a versioned script |
| 10 | working dirs + asset tree        | manifest-driven; not hardcoded                         |
| 11 | journald cap (500 MB)            | logs can't eat the 100 GB HDD                          |
| 12 | unattended-upgrades              | security patches only, no auto-reboot                  |

Each section guards against re-runs. Safe to invoke twice; the second run is a
no-op for steps that already completed.

---

## Hardening highlights (vs the previous version)

### Closed: Docker bypassing UFW (CRITICAL)

By default, Docker writes its own iptables rules that run **before** UFW.
Means `ufw deny 443` would not block traffic to a published container port.

**Fix:** section 5 installs [`ufw-docker`](https://github.com/chaifeng/ufw-docker)
and patches the `DOCKER-USER` chain so UFW rules govern container traffic too.

Verify after install:
```bash
sudo iptables -L DOCKER-USER -n
# Should show ufw-user-forward jump rules, not just RETURN.
```

### Closed: deploy user had unscoped sudo (CRITICAL)

Previous version: `deploy ALL=(ALL) NOPASSWD: ALL`. Compromise of the deploy
SSH key = instant root.

**Fix:** sudoers (section 7) now allows only:

```
/usr/bin/docker, /usr/bin/docker compose, /usr/bin/docker-compose
/usr/bin/certbot renew, /usr/bin/certbot renew --dry-run
/usr/local/bin/certbot-reload-nginx
/bin/systemctl reload|restart nginx
/bin/systemctl status docker|nginx
```

Anything else (apt, useradd, edits to /etc) requires password, and
`scripts/deploy.sh` doesn't need them.

### Closed: fail2ban installed but unconfigured (CRITICAL)

Previous version: package installed, no jails. Daemon ran idle.

**Fix:** section 8 writes `/etc/fail2ban/jail.d/sshd.local` with maxretry=3,
findtime=10m, bantime=1h, increment-on-recidivism up to 24h.

### Closed: UFW reset before SSH allow (lockout window)

Previous order: `ufw --force reset` → then `ufw allow 22`. If anything between
those two steps errored out (network blip, Ctrl+C), default-deny was active
with no SSH allow rule = locked out of a fresh provision.

**Fix:** section 5 inserts `ufw allow 22/tcp` *before* the reset. Belt-and-
suspenders: the post-reset block re-asserts the rule.

### Closed: certbot post-hook path didn't exist on fresh server

Previous cron line referenced `/home/deploy/thehideaway/compose.prod.yaml`
inline. On a fresh box, that path doesn't exist until the deploy user clones,
so cron failed silently every day.

**Fix:** section 9 installs `/usr/local/bin/certbot-reload-nginx` (sourced from
`scripts/certbot-reload-nginx`) which exits 0 gracefully when:
- compose file not yet present (pre-deploy state)
- nginx container not yet running

Returns 1 only when nginx exists but `nginx -t` or `nginx -s reload` actually
fail — i.e. real problems that should mail an operator.

### Closed: journald could eat the HDD

100 GB HDD + verbose containerized stack (postgres, payload, nginx all logging
through Docker → journald) meant journal could grow unbounded.

**Fix:** section 11 caps `SystemMaxUse=500M`, keeps 2 GB free.

### Closed: asset directories were hardcoded in the script

Previous version: setup script hardcoded `/opt/thehideaway/assets/{plate,
rp_plaque,three}`. Active development churned those names; the script drifted.

**Fix:** section 10 calls `scripts/asset-bootstrap.sh init` which reads from
`scripts/asset-manifest.json`. To add/rename/remove an asset directory, edit
the manifest (or use `asset-bootstrap.sh resolve` interactively). Setup script
stays untouched.

---

## Asset manifest workflow

`scripts/asset-manifest.json` is the source of truth for which directories
must exist under `/opt/thehideaway/assets/`. Three modes:

```bash
# Dry-run — print present/missing table, exits 1 if anything required is missing
./scripts/asset-bootstrap.sh check
./scripts/asset-bootstrap.sh check --root ./public/assets    # local sanity check
./scripts/asset-bootstrap.sh check --json --quiet            # for CI / scripts

# Create empty dirs for everything in the manifest (idempotent)
./scripts/asset-bootstrap.sh init

# Interactively reconcile the manifest with reality. For each missing entry:
#   [i] ignore — re-prompt next run
#   [r] remove — delete from manifest (mutates the JSON)
#   [p] path  — supply a new relative path (mutates the JSON)
#   [a] abort — exit without changes
./scripts/asset-bootstrap.sh resolve
```

Adding a new asset directory: edit `asset-manifest.json`, append an entry,
commit. Next `init` run on the server creates it. Next `check` validates.

---

## Dockge — compose admin GUI

Added as a fifth service in `compose.prod.yaml`, gated behind the `admin`
profile (off by default). Bound to `127.0.0.1:5001` only — no public exposure.

Why Dockge over Portainer: compose-first (it edits our actual `compose.prod.
yaml`), MIT-licensed, 30 MB RAM (vs Portainer's ~80 MB — meaningful on a 4 GB
box where postgres + payload + nginx already eat ~3.75 GB).

### Enabling

```bash
# On the VPS, as deploy:
docker compose -f compose.prod.yaml --profile admin up -d dockge
```

### Accessing

Two layers of auth: SSH tunnel + Dockge's own login.

```bash
# On your laptop:
ssh -N -L 5001:127.0.0.1:5001 deploy@hideawayseoul.com
# In another terminal / browser:
open http://localhost:5001
```

First visit: set up the admin user. Use a long random password (Dockge has
root-equivalent power on this host).

### Disabling

```bash
docker compose -f compose.prod.yaml stop dockge
# Or remove entirely:
docker compose -f compose.prod.yaml --profile admin down dockge
```

The `dockge_data` volume persists user/session state — `down -v` removes it.

---

## One-shot first deploy

For the very first deployment on a fresh VPS, `scripts/first-deploy.sh` wraps
the seven post-provision steps (server-setup → DNS poll → certbot → repo
clone → pre-flight → first deploy → health check) into a single command.

```bash
# On the VPS as root, from the cloned repo:
bash scripts/first-deploy.sh \
    --deploy-key "ssh-ed25519 AAAA... your-pubkey" \
    --image-tag <git-sha-or-tag>
```

The wrapper is fully idempotent — safe to re-run after partial failures. It
exits with a specific code per failure class:

| Code | Meaning                                                            |
|------|--------------------------------------------------------------------|
| 0    | Success                                                            |
| 2    | Misuse (missing or invalid flags)                                  |
| 3    | Pre-flight failure (.env.production placeholders, empty asset tree) |
| 4    | DNS never converged (timeout after ~10 min, or unreachable)         |
| 5    | Certbot failed (rate-limited, DNS, port 80 in use)                  |
| 6    | Deploy or post-deploy health check failed                          |
| 7    | GitHub SSH auth failed after deploy key was added                  |

### Phase 5 — GitHub deploy key (the one interactive pause)

Phase 5 generates an ed25519 keypair at `/home/deploy/.ssh/github`, prints
the public half, and pauses for you to paste it into the repo's GitHub
**Settings → Deploy keys → Add deploy key** (read-only is enough). Once you
press Enter, the wrapper:

1. Writes `~deploy/.ssh/config` so `github.com` uses the new key.
2. Pre-populates `~deploy/.ssh/known_hosts` with GitHub's host keys (no
   accept-prompt on first clone).
3. Runs `ssh -T git@github.com` and greps for "successfully authenticated".

If auth fails, the script exits **7** and tells you exactly where to verify
the deploy key on GitHub. To retry just phase 5 onward:

```bash
bash scripts/first-deploy.sh \
    --deploy-key "..." --image-tag <sha> \
    --skip-setup --skip-dns --skip-cert
```

After the first successful run, the keypair is reused on subsequent
deploys — the pause is one-time.

### Skip flags for re-runs

- `--skip-setup` — server-setup.sh already ran; just do the deploy phases
- `--skip-dns` — you've staged DNS another way (e.g. DNS-01, manual upload)
- `--skip-cert` — cert already at `/etc/letsencrypt/live/$DOMAIN/`
- `--skip-gh-key` — deploy user already has a working SSH identity for GitHub
- `--domain` — override (defaults to `hideawayseoul.com`)

For all subsequent deploys (after the first), use `scripts/deploy.sh` directly
— smaller surface, no DNS / cert / pre-flight overhead. Roll back with
`./scripts/deploy.sh --rollback`.

---

## Verifying after a run

The script's self-test checks docker, sshd, fail2ban, ufw, and the cert helper.
Run it manually to revalidate:

```bash
# Docker bypass closure
sudo iptables -L DOCKER-USER -n | grep -q ufw-user && echo "✓ ufw-docker active"

# fail2ban jail
sudo fail2ban-client status sshd

# Sudoers scope (should NOT include ALL: ALL)
sudo grep deploy /etc/sudoers.d/99-deploy

# journald cap
journalctl --disk-usage

# Asset tree matches manifest
sudo /home/deploy/thehideaway/scripts/asset-bootstrap.sh check

# Cert renewal wiring
sudo certbot renew --dry-run
```

---

## Open items (deferred, not in this commit)

- **Offsite backups.** `pgdata` and `/home/deploy/backups/` share the 100 GB HDD.
  Disk failure loses both. Add an rclone push to S3/R2 before going live.
- **BBR + fq congestion control.** 2-line sysctl add for measurable TTFB
  improvement; left out of this pass to keep the diff tight.
- **`--domain` flag.** `hideawayseoul.com` is still hardcoded in the post-run
  summary text. Lift to a script-top variable when this script is reused for
  another project.
- **`--deploy-keys-file`.** Current `--deploy-key` only takes one key.
- **logrotate snippet for `/home/deploy/thehideaway/nginx/logs/`.** Bind-mounted
  log dir grows unbounded without one.
- **userns-remap on Docker daemon.** Defense-in-depth; opt-in tradeoff with
  bind-mount UID mapping (would need to chown the asset tree to the remapped
  range).
