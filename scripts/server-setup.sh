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
#   5.  UFW firewall (SSH 22, HTTP 80, HTTPS 443)
#   6.  Docker CE + daemon hardening (log rotation, live-restore)
#   7.  deploy user (no-password sudo, optional SSH key)
#   8.  Certbot (for Let's Encrypt TLS)
#   9.  Working directories (certbot webroot, backups, nginx logs)
#   10. unattended-upgrades (security patches only)
#
# After running, complete TLS setup:
#   certbot certonly --standalone -d hideawayseoul.com  # before nginx starts
#   OR (after nginx is running on port 80):
#   certbot certonly --webroot -w /var/www/certbot -d hideawayseoul.com
#
# Then: copy .env.production to /home/deploy/thehideaway/ and run prod.sh.

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
info()  { echo -e "${GREEN}→${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
error() { echo -e "${RED}✗${NC}  $*" >&2; }

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
info "[1/10] Updating system packages..."
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq
DEBIAN_FRONTEND=noninteractive apt-get install -yq \
  curl wget git unzip htop \
  fail2ban \
  ufw \
  ca-certificates gnupg lsb-release \
  logrotate \
  jq

# ────────────────────────────────────────────────────────────────────────────
# 2. Swap (4 GB — same as RAM, good for a 4 GB server)
# ────────────────────────────────────────────────────────────────────────────
info "[2/10] Configuring swap..."
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
info "[3/10] Applying sysctl tuning..."
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
# Required for nginx 2048 worker_connections × auto worker_processes
fs.file-max   = 200000
fs.nr_open    = 200000

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
info "[4/10] Hardening sshd..."
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

# Validate sshd config before reloading
if sshd -t; then
  systemctl reload sshd
  echo "  sshd hardening applied"
else
  error "sshd config validation failed — check ${SSHD_CONF}"
  exit 1
fi

# ────────────────────────────────────────────────────────────────────────────
# 5. UFW firewall
# ────────────────────────────────────────────────────────────────────────────
info "[5/10] Configuring UFW firewall..."

# Default deny in/out, then poke required holes.
# IMPORTANT: Allow SSH first to avoid locking ourselves out.
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

# ────────────────────────────────────────────────────────────────────────────
# 6. Docker CE
# ────────────────────────────────────────────────────────────────────────────
info "[6/10] Installing / configuring Docker..."
if ! command -v docker &> /dev/null; then
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

# ────────────────────────────────────────────────────────────────────────────
# 7. Deploy user
# ────────────────────────────────────────────────────────────────────────────
info "[7/10] Configuring deploy user..."
if ! id -u deploy &> /dev/null; then
  useradd -m -s /bin/bash -G docker deploy
  echo "  Created user: deploy"
else
  # Ensure deploy is in the docker group
  usermod -aG docker deploy
  echo "  User deploy already exists — ensured docker group membership"
fi

# No-password sudo for deploy (allows ./prod.sh, docker commands, etc.)
SUDOERS_FILE="/etc/sudoers.d/99-deploy"
echo "deploy ALL=(ALL) NOPASSWD: ALL" > "${SUDOERS_FILE}"
chmod 440 "${SUDOERS_FILE}"

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
# 8. Certbot
# ────────────────────────────────────────────────────────────────────────────
info "[8/10] Installing Certbot..."
if ! command -v certbot &> /dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -yq certbot
  echo "  Certbot installed"
else
  echo "  Certbot already installed: $(certbot --version)"
fi

# Install renewal cron if not present
if ! crontab -l 2>/dev/null | grep -q 'certbot renew'; then
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --webroot -w /var/www/certbot --post-hook 'docker compose -f /home/deploy/thehideaway/compose.prod.yaml exec nginx nginx -s reload'") | crontab -
  echo "  Certbot renewal cron installed (daily at 03:00)"
fi

# ────────────────────────────────────────────────────────────────────────────
# 9. Working directories
# ────────────────────────────────────────────────────────────────────────────
info "[9/10] Creating working directories..."

# Certbot ACME webroot (nginx serves /.well-known/acme-challenge/ from here)
install -o www-data -g www-data -m 0755 -d /var/www/certbot

# nginx logs (bind-mounted in compose.prod.yaml)
install -o deploy -g deploy -m 0755 -d /home/deploy/thehideaway/nginx/logs

# Backups directory (for manual and scripted pg_dumps)
install -o deploy -g deploy -m 0700 -d /home/deploy/backups

# App repo directory (deploy user clones here)
install -o deploy -g deploy -m 0755 -d /home/deploy/thehideaway

echo "  Directories created"

# ────────────────────────────────────────────────────────────────────────────
# 10. unattended-upgrades (security patches only — never auto-restarts services)
# ────────────────────────────────────────────────────────────────────────────
info "[10/10] Enabling unattended-upgrades..."
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
// Do NOT reboot automatically — coordinate with prod.sh deploy window
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

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "  ✓ Server setup complete"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Verify SSH access as deploy user before closing this session:"
echo "       ssh deploy@<server-ip>"
echo ""
echo "  2. Get the TLS certificate (run as root or deploy):"
echo "       # Option A — standalone (while nginx is NOT running):"
echo "       certbot certonly --standalone -d hideawayseoul.com -d www.hideawayseoul.com"
echo ""
echo "       # Option B — webroot (while nginx IS running on port 80):"
echo "       certbot certonly --webroot -w /var/www/certbot \\"
echo "         -d hideawayseoul.com -d www.hideawayseoul.com"
echo ""
echo "  3. Clone the repo and deploy:"
echo "       su - deploy"
echo "       cd thehideaway"
echo "       cp .env.production.example .env.production  # fill in secrets"
echo "       docker network create --ipv6=true hideaway"
echo "       IMAGE_TAG=<sha> ./prod.sh"
echo ""
