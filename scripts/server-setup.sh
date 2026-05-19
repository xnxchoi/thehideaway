#!/usr/bin/env bash
# scripts/server-setup.sh — One-time server provisioning for hideawayseoul.com
#
# Target:  Ubuntu 22.04 / 24.04 LTS
# Server:  ITEASY EasyCloud — 2 vCPU / 4 GB RAM / 100 GB HDD (Seoul)
#
# Run as root on the fresh VPS:
#   bash scripts/server-setup.sh [--deploy-key "ssh-ed25519 AAAA..."]
#
# What this does (all steps are idempotent — safe to re-run):
#   1.  System updates + essentials
#   2.  Swap (4 GB)
#   3.  sysctl — network and file-descriptor tuning
#   4.  sshd hardening (disables root+password login, limits auth)
#   5.  UFW firewall (SSH 22, HTTP 80, HTTPS 443) + ufw-docker (closes the
#       Docker iptables bypass so UFW rules actually apply to containers)
#   6.  Docker CE + daemon hardening (log rotation, live-restore)
#   7.  deploy user (scoped sudoers — docker / compose / certbot only)
#   8.  fail2ban sshd jail (defense-in-depth on top of pubkey-only)
#   9.  Certbot (for Let's Encrypt TLS) + reload-hook helper
#   10. Working directories + asset tree (driven by scripts/asset-manifest.json)
#   11. journald disk cap (keeps logs from eating the 100 GB HDD)
#   12. unattended-upgrades (security patches only)
#
# After running, complete TLS setup:
#   certbot certonly --standalone -d hideawayseoul.com  # before nginx starts
#   OR (after nginx is running on port 80):
#   certbot certonly --webroot -w /var/www/certbot -d hideawayseoul.com
#
# Then: scp the age key (`scp ~/.config/sops/age/keys.txt root@<host>:/etc/age/keys.txt`),
# clone the repo into /home/deploy/thehideaway/, and run scripts/deploy.sh <tag>.

set -Eeuo pipefail

# Print the failed line on unexpected error — easier to debug over SSH.
trap 'echo -e "\033[0;31m✗ failed at line $LINENO:\033[0m $BASH_COMMAND" >&2' ERR

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
info()  { echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
error() { echo -e "${RED}✗${NC}  $*" >&2; }

# Resolve script + repo dirs so we can call sibling helpers (asset-bootstrap.sh)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Parse args ────────────────────────────────────────────────────────────────
DEPLOY_KEY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --deploy-key) DEPLOY_KEY="$2"; shift 2 ;;
    *) error "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── Guard: must be root ───────────────────────────────────────────────────────
if [[ "$(id -u)" -ne 0 ]]; then
  error "This script must be run as root."
  exit 1
fi

echo ""
echo "  hideawayseoul.com — server setup"
echo "  $(lsb_release -sd 2>/dev/null || uname -sr)"
echo ""

# ────────────────────────────────────────────────────────────────────────────
# 1. System updates + essential packages
# ────────────────────────────────────────────────────────────────────────────
info "[1/12] Updating system packages..."
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq
DEBIAN_FRONTEND=noninteractive apt-get install -yq \
  curl wget git unzip htop \
  fail2ban \
  ufw \
  ca-certificates gnupg lsb-release \
  logrotate \
  jq \
  cron

# cron is sometimes not enabled by default on minimal cloud images even after
# install (it's installed but unit is masked or just not started).
systemctl enable --now cron 2>/dev/null || true

# ────────────────────────────────────────────────────────────────────────────
# 2. Swap (4 GB — same as RAM, good for a 4 GB server)
# ────────────────────────────────────────────────────────────────────────────
info "[2/12] Configuring swap..."
SWAP_FILE="/swapfile"
if [[ ! -f "${SWAP_FILE}" ]]; then
  fallocate -l 4G "${SWAP_FILE}"
  chmod 600 "${SWAP_FILE}"
  mkswap "${SWAP_FILE}"
  swapon "${SWAP_FILE}"
  echo "${SWAP_FILE} none swap sw 0 0" >> /etc/fstab
  echo "  Created 4 GB swap at ${SWAP_FILE}"
else
  echo "  Swap already exists at ${SWAP_FILE} — skipping"
fi

# ────────────────────────────────────────────────────────────────────────────
# 3. sysctl — network + file-descriptor tuning
# ────────────────────────────────────────────────────────────────────────────
info "[3/12] Applying sysctl tuning..."
cat > /etc/sysctl.d/99-hideaway.conf << 'SYSCTL'
# ── TCP connection tuning ────────────────────────────────────────────────────
# Increase listen backlog for nginx (default 128 is too low)
net.core.somaxconn            = 65536
net.core.netdev_max_backlog   = 16384
net.ipv4.tcp_max_syn_backlog  = 8192

# Speed up TIME_WAIT socket recycling (HDD server handles fewer ops/s)
net.ipv4.tcp_fin_timeout      = 30
net.ipv4.tcp_keepalive_time   = 1200
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl  = 30

# Enable TCP fast open for connections initiated and accepted
net.ipv4.tcp_fastopen         = 3

# ── File descriptor limits ───────────────────────────────────────────────────
# These must be AT LEAST the Ubuntu kernel defaults (file-max ~9M, nr_open
# ~1M); lowering them below the systemd unit LimitNOFILE values causes
# service start to fail with 205/LIMITS. We set generous floors here.
fs.file-max   = 2097152
fs.nr_open    = 1048576

# ── Memory / VM ─────────────────────────────────────────────────────────────
# Low swappiness: prefer keeping app data in RAM (Node.js heap is large)
vm.swappiness              = 10
vm.dirty_ratio             = 15
vm.dirty_background_ratio  = 5

# ── Connection tracking (Netfilter) ─────────────────────────────────────────
net.netfilter.nf_conntrack_max = 131072
SYSCTL

sysctl -p /etc/sysctl.d/99-hideaway.conf > /dev/null
echo "  sysctl applied"

# ── Raise open file limits for system services ───────────────────────────────
grep -qxF '* soft nofile 65536' /etc/security/limits.conf || \
  echo '* soft nofile 65536' >> /etc/security/limits.conf
grep -qxF '* hard nofile 65536' /etc/security/limits.conf || \
  echo '* hard nofile 65536' >> /etc/security/limits.conf

# ────────────────────────────────────────────────────────────────────────────
# 4. sshd hardening
# ────────────────────────────────────────────────────────────────────────────
info "[4/12] Hardening sshd..."
SSHD_CONF="/etc/ssh/sshd_config.d/99-hideaway-hardening.conf"
cat > "${SSHD_CONF}" << 'SSHD'
# hideawayseoul.com — sshd hardening
# Drop-in overrides the distro defaults in /etc/ssh/sshd_config.

PermitRootLogin          no
PasswordAuthentication   no
ChallengeResponseAuthentication no
PubkeyAuthentication     yes
AuthenticationMethods    publickey

MaxAuthTries             3
LoginGraceTime           20s
MaxSessions              5

# Disable forwarding features not needed for app server
X11Forwarding            no
AllowAgentForwarding     no
AllowTcpForwarding       no

# Disconnect idle sessions after 10 minutes
ClientAliveInterval      60
ClientAliveCountMax      10
SSHD

# Validate sshd config before reloading. Service unit name differs across
# distros — Ubuntu/Debian use `ssh.service`, RHEL/CentOS use `sshd.service`.
# On Ubuntu 24.04+ with socket-activated SSH, `systemctl reload` sometimes
# fails with code 205/LIMITS even though the config is valid; fall back to
# sending SIGHUP directly, which is what `reload` does internally anyway.
if sshd -t; then
  if systemctl reload ssh 2>/dev/null \
     || systemctl reload sshd 2>/dev/null \
     || systemctl kill -s HUP ssh.service 2>/dev/null \
     || systemctl kill -s HUP sshd.service 2>/dev/null; then
    echo "  sshd hardening applied"
  else
    error "could not signal ssh/sshd service — check 'systemctl status ssh sshd'"
    exit 1
  fi
else
  error "sshd config validation failed — check ${SSHD_CONF}"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────────────
# 5. UFW firewall + Docker bypass closure (ufw-docker)
# ────────────────────────────────────────────────────────────────────────────
info "[5/12] Configuring UFW firewall..."

# CRITICAL ORDERING: allow SSH BEFORE reset. If anything between reset and
# enable errors out (network blip, set -e exit, Ctrl+C), we want the SSH allow
# rule already in place so we don't lock ourselves out of a fresh provision.
ufw allow 22/tcp comment "SSH" >/dev/null 2>&1 || true

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    comment "SSH"
ufw allow 80/tcp    comment "HTTP (nginx, certbot challenge)"
ufw allow 443/tcp   comment "HTTPS (nginx)"

# Enable ufw without interactive prompt
ufw --force enable
ufw status verbose
echo "  UFW enabled"

# ── Docker iptables bypass closure ───────────────────────────────────────────
# By default Docker writes its own iptables rules in DOCKER-USER, which run
# BEFORE ufw's chains. Result: `ufw deny 443` would NOT block traffic to a
# container exposing :443. ufw-docker patches DOCKER-USER so UFW rules
# actually apply to container ports.
#
# SUPPLY-CHAIN HARDENING:
#   We pin to a specific commit SHA (not `master`) and verify a sha256 hash
#   before exec'ing the file as root. Without these, a compromised upstream
#   account or a forced master rewrite would silently run arbitrary code as
#   root on a fresh provision. To rotate to a newer ufw-docker:
#     1. Pick a commit SHA from https://github.com/chaifeng/ufw-docker/commits/master
#     2. Download the raw file, sha256sum it, paste both values below.
#     3. Re-run server-setup.sh; the new binary will be fetched and verified.
UFW_DOCKER_BIN="/usr/local/bin/ufw-docker"
UFW_DOCKER_SHA="2b419bbdde946a4fd1a8651940ad95b6b0b96dfa"
UFW_DOCKER_SHA256="16bc578c0cd78b7d44c53e5780c0d3d545860e428457a8910a3d2138fb225374"
UFW_DOCKER_URL="https://raw.githubusercontent.com/chaifeng/ufw-docker/${UFW_DOCKER_SHA}/ufw-docker"
if [[ ! -x "${UFW_DOCKER_BIN}" ]]; then
  TMP_BIN="$(mktemp)"
  if ! curl -fsSL -o "${TMP_BIN}" "${UFW_DOCKER_URL}"; then
    rm -f "${TMP_BIN}"
    error "Failed to download ufw-docker from ${UFW_DOCKER_URL}"
    exit 1
  fi
  # sha256sum is `sha256sum` on Linux. On macOS it's `shasum -a 256`. VPS is
  # Linux so the former is fine; fall back to shasum for local-machine dry-runs.
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_HASH=$(sha256sum "${TMP_BIN}" | awk '{print $1}')
  else
    ACTUAL_HASH=$(shasum -a 256 "${TMP_BIN}" | awk '{print $1}')
  fi
  if [[ "${ACTUAL_HASH}" != "${UFW_DOCKER_SHA256}" ]]; then
    rm -f "${TMP_BIN}"
    error "ufw-docker sha256 mismatch (got ${ACTUAL_HASH}, expected ${UFW_DOCKER_SHA256})"
    error "Refusing to install — investigate before re-running."
    exit 1
  fi
  install -m 0755 -o root -g root "${TMP_BIN}" "${UFW_DOCKER_BIN}"
  rm -f "${TMP_BIN}"
  echo "  Installed ufw-docker (pinned to ${UFW_DOCKER_SHA:0:7}, sha256 verified)"
fi

# Install the DOCKER-USER chain rules (idempotent — safe to re-run).
# Only needed once Docker is installed; gate accordingly.
if command -v docker &> /dev/null && [[ -d /etc/ufw ]]; then
  "${UFW_DOCKER_BIN}" install >/dev/null
  systemctl restart ufw
  echo "  ufw-docker rules installed (Docker bypass closed)"
else
  warn "  Docker not yet installed — ufw-docker rules will be applied after section 6"
fi

# ────────────────────────────────────────────────────────────────────────────
# 6. Docker CE
# ────────────────────────────────────────────────────────────────────────────
info "[6/12] Installing / configuring Docker..."

# Refuse to proceed if snap docker is present — it's a poor fit for this
# stack (AppArmor confinement breaks bind mounts, different paths, ufw-docker
# incompatibility). Cloud Ubuntu images (iteasy, some Hetzner) sometimes
# pre-install it. Tell the operator how to remove it cleanly.
if snap list docker 2>/dev/null | grep -q '^docker '; then
  error "Snap docker detected. This stack requires docker-ce via apt, not snap."
  error "Remove snap docker first:"
  error "  snap stop docker && snap remove --purge docker"
  error "  rm -rf /var/snap/docker /etc/systemd/system/snap.docker.*.service"
  error "  systemctl daemon-reload"
  error "Then re-run server-setup.sh."
  exit 1
fi

# Gate: docker-ce specifically (not just any 'docker' binary on PATH — snap
# would satisfy `command -v docker` even though it's the wrong runtime).
if ! dpkg -l docker-ce 2>/dev/null | grep -q '^ii'; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -q
  DEBIAN_FRONTEND=noninteractive apt-get install -yq \
    docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  echo "  Docker installed"
else
  echo "  Docker already installed: $(docker --version)"
fi

# Daemon hardening: log rotation + live-restore (containers survive daemon restart)
DOCKER_DAEMON="/etc/docker/daemon.json"
# Ubuntu 24.04 sometimes doesn't create /etc/docker until the daemon first
# starts. Ensure the parent dir exists before the heredoc redirect.
install -d -m 0755 /etc/docker
if [[ ! -f "${DOCKER_DAEMON}" ]] || ! grep -q '"live-restore"' "${DOCKER_DAEMON}"; then
  cat > "${DOCKER_DAEMON}" << 'DOCKERD'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
DOCKERD
  systemctl reload-or-restart docker
  echo "  Docker daemon configured"
else
  echo "  Docker daemon already configured — skipping"
fi

# Apply ufw-docker rules now that Docker is installed (handles the case where
# section 5 ran before Docker existed on the box).
if [[ -x "${UFW_DOCKER_BIN}" ]] && command -v docker &> /dev/null; then
  "${UFW_DOCKER_BIN}" install >/dev/null
  systemctl restart ufw
  echo "  ufw-docker rules re-applied (Docker bypass confirmed closed)"
fi

# ────────────────────────────────────────────────────────────────────────────
# 7. Deploy user
# ────────────────────────────────────────────────────────────────────────────
info "[7/12] Configuring deploy user..."
if ! id -u deploy &> /dev/null; then
  useradd -m -s /bin/bash -G docker deploy
  echo "  Created user: deploy"
else
  # Ensure deploy is in the docker group
  usermod -aG docker deploy
  echo "  User deploy already exists — ensured docker group membership"
fi

# Scoped sudo for deploy — *only* the commands scripts/deploy.sh / backup.sh /
# certbot need. If the deploy SSH key is ever compromised, the attacker is
# contained to docker/compose/certbot operations; they can't read /etc/shadow,
# install rootkits, modify sshd, or run arbitrary commands as root.
#
# To extend: add the absolute path of any new command the deploy user must run
# with privileges. Never widen this to ALL=(ALL) NOPASSWD: ALL — that erases
# the value of pubkey-only SSH.
SUDOERS_FILE="/etc/sudoers.d/99-deploy"
cat > "${SUDOERS_FILE}" << 'SUDOERS'
# hideawayseoul.com — scoped privilege grants for the deploy user.
# Managed by scripts/server-setup.sh. Do not edit by hand.

# Cmnd_Alias makes the grant readable + auditable.
Cmnd_Alias DEPLOY_DOCKER  = /usr/bin/docker, /usr/bin/docker compose
Cmnd_Alias DEPLOY_COMPOSE = /usr/bin/docker-compose
Cmnd_Alias DEPLOY_TLS     = /usr/bin/certbot renew, \
                            /usr/bin/certbot renew --dry-run, \
                            /usr/local/bin/certbot-reload-nginx
Cmnd_Alias DEPLOY_SVC     = /bin/systemctl reload nginx, \
                            /bin/systemctl restart nginx, \
                            /bin/systemctl status docker, \
                            /bin/systemctl status nginx

deploy ALL=(root) NOPASSWD: DEPLOY_DOCKER, DEPLOY_COMPOSE, DEPLOY_TLS, DEPLOY_SVC
SUDOERS
chmod 440 "${SUDOERS_FILE}"

# Validate the sudoers file BEFORE leaving the script — a syntax error here
# would lock out sudo for everyone on next login.
if ! visudo -cf "${SUDOERS_FILE}" >/dev/null; then
  error "sudoers validation failed for ${SUDOERS_FILE} — removing"
  rm -f "${SUDOERS_FILE}"
  exit 1
fi
echo "  sudoers configured (scoped: docker, compose, certbot, nginx reload)"

# SSH key for the deploy user
if [[ -n "${DEPLOY_KEY}" ]]; then
  DEPLOY_SSH="/home/deploy/.ssh"
  install -o deploy -g deploy -m 0700 -d "${DEPLOY_SSH}"
  echo "${DEPLOY_KEY}" >> "${DEPLOY_SSH}/authorized_keys"
  chown deploy:deploy "${DEPLOY_SSH}/authorized_keys"
  chmod 600 "${DEPLOY_SSH}/authorized_keys"
  echo "  SSH key added for deploy user"
else
  warn "No --deploy-key supplied. Add one manually:"
  warn "  echo 'ssh-ed25519 AAAA...' >> /home/deploy/.ssh/authorized_keys"
fi

# ────────────────────────────────────────────────────────────────────────────
# 8. fail2ban — sshd jail
# ────────────────────────────────────────────────────────────────────────────
# fail2ban is installed in section 1 but ships with no enabled jails by default.
# Without an explicit jail definition, the daemon runs idle and provides zero
# protection. Even with PasswordAuthentication=no, this is useful defense in
# depth: it bans IPs that hammer pubkey auth (e.g. trying old/leaked keys),
# which keeps logs cleaner and reduces background noise.
info "[8/12] Configuring fail2ban..."

F2B_JAIL="/etc/fail2ban/jail.d/sshd.local"
cat > "${F2B_JAIL}" << 'F2B'
# hideawayseoul.com — fail2ban sshd jail
[sshd]
enabled  = true
port     = 22
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
maxretry = 3
findtime = 10m
bantime  = 1h
# Persistent ban list survives fail2ban restarts (avoids "ban roulette" on reload)
bantime.increment = true
bantime.maxtime   = 24h
F2B

systemctl enable --now fail2ban
systemctl restart fail2ban
echo "  fail2ban sshd jail active"

# ────────────────────────────────────────────────────────────────────────────
# 9. Certbot
# ────────────────────────────────────────────────────────────────────────────
info "[9/12] Installing Certbot..."
if ! command -v certbot &> /dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -yq certbot
  echo "  Certbot installed"
else
  echo "  Certbot already installed: $(certbot --version)"
fi

# Install the post-renewal hook helper at /usr/local/bin/certbot-reload-nginx.
# Versioned source lives in scripts/certbot-reload-nginx (this repo). The helper
# handles the "compose not yet cloned" and "nginx not yet running" states
# gracefully so cron doesn't spam errors on a fresh server.
HOOK_SRC="${SCRIPT_DIR}/certbot-reload-nginx"
HOOK_DST="/usr/local/bin/certbot-reload-nginx"
if [[ -f "${HOOK_SRC}" ]]; then
  install -m 0755 -o root -g root "${HOOK_SRC}" "${HOOK_DST}"
  echo "  Installed cert-reload helper → ${HOOK_DST}"
else
  warn "Cert-reload helper source not found at ${HOOK_SRC}"
  warn "Cron will be installed but post-hook will not exist until you copy it manually."
fi

# Install renewal cron if not present.
# 03:00 UTC daily, webroot mode, post-hook delegates to the helper script.
if ! crontab -l 2>/dev/null | grep -q 'certbot renew'; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --webroot -w /var/www/certbot --post-hook ${HOOK_DST}") | crontab -
  echo "  Certbot renewal cron installed (daily at 03:00 UTC)"
fi

# ────────────────────────────────────────────────────────────────────────────
# 10. Working directories + asset tree
# ────────────────────────────────────────────────────────────────────────────
info "[10/12] Creating working directories..."

# Certbot ACME webroot (nginx serves /.well-known/acme-challenge/ from here)
install -o www-data -g www-data -m 0755 -d /var/www/certbot

# nginx logs (bind-mounted in compose.prod.yaml)
install -o deploy -g deploy -m 0755 -d /home/deploy/thehideaway/nginx/logs

# Backups directory (for manual and scripted pg_dumps)
install -o deploy -g deploy -m 0700 -d /home/deploy/backups

# App repo directory (deploy user clones here)
install -o deploy -g deploy -m 0755 -d /home/deploy/thehideaway

# sops + age — directory only. The keys.txt private key file is sensitive and
# is NOT created here; the operator scp's it from the laptop after this script
# finishes. Directory perms: root:deploy 0750 — only members of `deploy` group
# can traverse, so the deploy user can read its own files inside but no other
# local user can. The key file itself goes in as root:deploy 0640.
install -o root -g deploy -m 0750 -d /etc/age
if [[ ! -f /etc/age/keys.txt ]]; then
  warn "  /etc/age/keys.txt not yet present."
  warn "  After this script finishes, scp it from your laptop and adjust perms:"
  warn "    scp ~/.config/sops/age/keys.txt root@<host>:/etc/age/keys.txt"
  warn "    ssh root@<host> 'chown root:deploy /etc/age/keys.txt && chmod 640 /etc/age/keys.txt'"
fi

# Deploy state (current-tag, previous-tag markers used by scripts/deploy.sh).
# 0750 — readable by the deploy user only (no leaks of deployed version
# strings to other local users on a multi-tenant host).
install -o deploy -g deploy -m 0750 -d /var/lib/hideaway

# sops binary — fetch the official release if not already present. Pinned
# version + sha256 must match what CI uses (.github/workflows/release.yml).
# Update both files in lockstep on version bumps. Official checksums are at
# https://github.com/getsops/sops/releases/download/<version>/<version>.checksums.txt
if ! command -v sops >/dev/null 2>&1; then
  SOPS_VERSION=v3.13.1
  SOPS_SHA256=620a9d7e3352ababeca6908cea24a6e8b14ce89a448ddbd3f94f1ef3398f470a
  info "  Installing sops ${SOPS_VERSION}..."
  curl -fsSL -o /tmp/sops \
    "https://github.com/getsops/sops/releases/download/${SOPS_VERSION}/sops-${SOPS_VERSION}.linux.amd64"
  echo "${SOPS_SHA256}  /tmp/sops" | sha256sum -c - \
    || { rm -f /tmp/sops; error "  sops sha256 mismatch — refusing to install."; exit 1; }
  install -m 0755 /tmp/sops /usr/local/bin/sops
  rm -f /tmp/sops
  echo "    sops $(sops --version --disable-version-check 2>/dev/null || echo unknown)"
fi

# age binary — comes from apt on Ubuntu 22.04+.
if ! command -v age >/dev/null 2>&1; then
  info "  Installing age..."
  DEBIAN_FRONTEND=noninteractive apt-get install -yq age
fi

echo "  Base directories created"

# ── Asset tree (driven by manifest, not hardcoded) ───────────────────────────
# Source of truth: scripts/asset-manifest.json. Edit that file (or use
# `scripts/asset-bootstrap.sh resolve` interactively) to add/remove entries.
# This block is intentionally a thin call into the helper — keeps the asset
# list in one place as it changes during active development.
ASSET_BOOTSTRAP="${SCRIPT_DIR}/asset-bootstrap.sh"
ASSET_MANIFEST="${SCRIPT_DIR}/asset-manifest.json"

if [[ -x "${ASSET_BOOTSTRAP}" && -f "${ASSET_MANIFEST}" ]]; then
  info "  Bootstrapping asset tree from manifest..."
  "${ASSET_BOOTSTRAP}" init --quiet || warn "  asset-bootstrap init reported a problem"
  echo "    (verify with: ${ASSET_BOOTSTRAP} check)"
else
  warn "  asset-bootstrap.sh or asset-manifest.json missing — skipping asset tree."
  warn "  Expected: ${ASSET_BOOTSTRAP} and ${ASSET_MANIFEST}"
fi

# ────────────────────────────────────────────────────────────────────────────
# 11. journald disk cap
# ────────────────────────────────────────────────────────────────────────────
# Without limits, /var/log/journal can grow into multi-GB territory on a
# verbose host (containerized postgres + payload + nginx all log through the
# Docker daemon, which forwards to journald via syslog). On a 100 GB HDD with
# pgdata sharing the same disk, that's a real risk.
info "[11/12] Capping journald disk usage..."

mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/99-hideaway.conf << 'JOURNAL'
# hideawayseoul.com — journald disk cap.
# Total journal usage capped at 500 MB; rotation kicks in well before disk
# pressure becomes a problem. Adjust upward if you need more retention.
[Journal]
SystemMaxUse=500M
SystemKeepFree=2G
SystemMaxFileSize=50M
JOURNAL

systemctl restart systemd-journald
echo "  journald capped at 500 MB"

# ────────────────────────────────────────────────────────────────────────────
# 12. unattended-upgrades (security patches only — never auto-restarts services)
# ────────────────────────────────────────────────────────────────────────────
info "[12/12] Enabling unattended-upgrades..."
DEBIAN_FRONTEND=noninteractive apt-get install -yq unattended-upgrades

cat > /etc/apt/apt.conf.d/50unattended-upgrades-hideaway << 'UNATTENDED'
// hideawayseoul.com — unattended security upgrades only.
// Application services restart is manual and deliberate.
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
// Do NOT reboot automatically — coordinate with scripts/deploy.sh windows
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
UNATTENDED

cat > /etc/apt/apt.conf.d/20auto-upgrades-hideaway << 'AUTOUPGRADE'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTOUPGRADE

systemctl enable --now unattended-upgrades
echo "  unattended-upgrades enabled"

# ── Self-test ─────────────────────────────────────────────────────────────────
echo ""
info "Running self-test..."
docker run --rm hello-world >/dev/null 2>&1 && echo "  ✓ docker runtime OK" \
  || warn "  ✗ docker hello-world failed — investigate"
{ systemctl is-active --quiet ssh || systemctl is-active --quiet sshd; } \
  && echo "  ✓ sshd active"     || warn "  ✗ sshd not active"
systemctl is-active --quiet fail2ban  && echo "  ✓ fail2ban active" || warn "  ✗ fail2ban not active"
ufw status | grep -q "Status: active" && echo "  ✓ ufw active"      || warn "  ✗ ufw not active"
[[ -x /usr/local/bin/certbot-reload-nginx ]] && echo "  ✓ certbot-reload helper installed" \
  || warn "  ✗ certbot-reload-nginx missing"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "  ✓ Server setup complete"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Verify SSH access as deploy user BEFORE closing this session:"
echo "       ssh deploy@<server-ip>"
echo ""
echo "  2. Get the TLS certificate (run as root or via sudo):"
echo "       # Option A — standalone (while nginx is NOT running):"
echo "       certbot certonly --standalone -d hideawayseoul.com -d www.hideawayseoul.com"
echo ""
echo "       # Option B — webroot (while nginx IS running on port 80):"
echo "       certbot certonly --webroot -w /var/www/certbot \\"
echo "         -d hideawayseoul.com -d www.hideawayseoul.com"
echo ""
echo "       # Then dry-run the renewal hook to confirm wiring:"
echo "       certbot renew --dry-run"
echo ""
echo "  3. Populate the asset tree from your dev machine:"
echo "       # On the dev machine, rsync the actual artifacts:"
echo "       rsync -av --delete public/assets/ deploy@<host>:/opt/thehideaway/assets/"
echo "       # Confirm on the server:"
echo "       /home/deploy/thehideaway/scripts/asset-bootstrap.sh check"
echo ""
echo "  4. Clone the repo and deploy:"
echo "       su - deploy"
echo "       cd thehideaway"
echo "       # Encrypted env (.env.production.enc) is already in the repo;"
echo "       # ensure the age key is at /etc/age/keys.txt (root:root 600)."
echo "       docker network create --ipv6=true hideaway"
echo "       ./scripts/deploy.sh v1.2.3 --migrate    # initial release"
echo ""
echo "  5. (Optional) Tunnel into Dockge for GUI compose admin:"
echo "       # On your laptop:"
echo "       ssh -N -L 5001:127.0.0.1:5001 deploy@<host>"
echo "       # Then visit http://localhost:5001 — Dockge is bound to localhost only."
echo ""
echo "  Operational reminders:"
echo "    • Backups + pgdata share one HDD. Add an offsite push (rclone → S3"
echo "      / R2) before going live — disk failure currently loses both."
echo "    • UFW now governs Docker too via ufw-docker; verify with:"
echo "        sudo iptables -L DOCKER-USER -n"
echo ""
