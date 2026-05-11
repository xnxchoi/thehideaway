#!/usr/bin/env bash
# scripts/first-deploy.sh — one-shot first deploy on a fresh production VPS.
#
# Wraps steps 2–7 of the deployment sequence into a single command so you
# don't have to remember the ordering or re-paste long SSH one-liners.
#
# ── Target ───────────────────────────────────────────────────────────────────
#   Ubuntu 22.04 / 24.04 LTS, fresh install, you have root SSH.
#   This script does NOT run on macOS — it shells out to apt, certbot,
#   systemctl, etc. Run on the VPS.
#
# ── Usage ────────────────────────────────────────────────────────────────────
#   As root on the VPS, from the cloned repo:
#     bash scripts/first-deploy.sh \
#         --deploy-key "ssh-ed25519 AAAA... your-pubkey" \
#         --image-tag <git-sha-or-tag>
#
#   Options:
#     --deploy-key KEY       (required) The deploy user's SSH pubkey, passed
#                            through to server-setup.sh. Anything that
#                            authorized_keys accepts is fine.
#     --image-tag TAG        (required) Docker image tag prod.sh will deploy.
#                            Usually a git SHA. Image must be loadable on the
#                            VPS (docker images | grep <tag>) before this
#                            script reaches phase 7, otherwise prod.sh will
#                            fail at the pull step.
#     --domain DOMAIN        (default: hideawayseoul.com) Domain to verify
#                            DNS for and request a TLS cert for.
#     --skip-dns             Bypass the DNS poll (useful if you know DNS is
#                            slow and you've staged the cert another way).
#     --skip-cert            Bypass certbot (useful if cert already exists
#                            at /etc/letsencrypt/live/$DOMAIN/).
#     --skip-setup           Bypass scripts/server-setup.sh (re-run only the
#                            deploy bits on an already-provisioned box).
#     -h | --help            Show this.
#
# ── What it does (each phase is idempotent) ──────────────────────────────────
#   1. Sanity — refuse to run anywhere that isn't a clean Ubuntu root shell.
#   2. server-setup.sh — OS hardening, Docker, certbot, deploy user.
#   3. DNS check — poll until $DOMAIN resolves to this machine's public IP.
#   4. TLS — certbot certonly --standalone for $DOMAIN.
#   5. Repo sync — clone or fast-forward into /home/deploy/thehideaway as
#      the deploy user. Source: this repo's `origin` remote.
#   6. Pre-flight — validate .env.production has no placeholders, and the
#      asset tree under /opt/thehideaway/assets is populated.
#   7. First deploy — ensure docker network, `prod.sh --full` (deploy +
#      migrate). Then health-check by hitting the local nginx.
#
# ── Exit codes ───────────────────────────────────────────────────────────────
#   0   Success
#   1   Generic failure (always with a printed reason)
#   2   Misuse (missing/invalid flags)
#   3   Pre-flight failure (.env.production missing values, assets empty)
#   4   DNS never converged within the polling window
#   5   Cert issuance failed
#   6   Deploy or post-deploy health check failed

set -Eeuo pipefail
trap 'echo -e "\033[0;31m✗ failed at line $LINENO:\033[0m $BASH_COMMAND" >&2' ERR

# ── Style helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
info()    { echo -e "${GREEN}→${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✗${NC}  $*" >&2; }
heading() { echo; echo -e "${CYAN}${BOLD}┌─ $* ────────────────────────────────────────${NC}"; }

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEPLOY_HOME="/home/deploy"
DEPLOY_REPO="${DEPLOY_HOME}/thehideaway"

# ── Defaults / args ──────────────────────────────────────────────────────────
DEPLOY_KEY=""
IMAGE_TAG=""
DOMAIN="hideawayseoul.com"
SKIP_DNS=false
SKIP_CERT=false
SKIP_SETUP=false

usage() { sed -n '2,/^set -Eeuo/p' "$0" | sed -n '2,/^$/p' | sed 's/^# \{0,1\}//'; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --deploy-key)  DEPLOY_KEY="$2"; shift 2 ;;
    --image-tag)   IMAGE_TAG="$2";  shift 2 ;;
    --domain)      DOMAIN="$2";     shift 2 ;;
    --skip-dns)    SKIP_DNS=true;   shift ;;
    --skip-cert)   SKIP_CERT=true;  shift ;;
    --skip-setup)  SKIP_SETUP=true; shift ;;
    -h|--help)     usage; exit 0 ;;
    *)             error "Unknown argument: $1 (try --help)"; exit 2 ;;
  esac
done

[[ -z "${DEPLOY_KEY}" ]] && { error "--deploy-key is required (see --help)"; exit 2; }
[[ -z "${IMAGE_TAG}"  ]] && { error "--image-tag is required (see --help)"; exit 2; }

# ── Phase 1: Sanity ──────────────────────────────────────────────────────────
heading "Phase 1/7: Sanity checks"
if [[ "$(id -u)" -ne 0 ]]; then
  error "first-deploy.sh must run as root."
  exit 1
fi
if ! grep -qi 'ubuntu' /etc/os-release 2>/dev/null; then
  warn "Not Ubuntu — server-setup.sh is tested on Ubuntu 22.04/24.04 only."
  warn "Continuing in 5s; Ctrl+C to abort."
  sleep 5
fi
if [[ ! -x "${SCRIPT_DIR}/server-setup.sh" ]]; then
  error "scripts/server-setup.sh not found at ${SCRIPT_DIR}/server-setup.sh"
  error "Run this from the cloned repo's root or scripts/ directory."
  exit 1
fi
info "Running as root on $(lsb_release -sd 2>/dev/null || uname -sr)"
info "Domain: ${BOLD}${DOMAIN}${NC}"
info "Image tag: ${BOLD}${IMAGE_TAG}${NC}"

# ── Phase 2: server-setup.sh ─────────────────────────────────────────────────
heading "Phase 2/7: server-setup.sh (OS hardening, Docker, certbot)"
if [[ "${SKIP_SETUP}" == true ]]; then
  warn "Skipping server-setup.sh (--skip-setup). Assuming the box is provisioned."
else
  bash "${SCRIPT_DIR}/server-setup.sh" --deploy-key "${DEPLOY_KEY}"
  info "server-setup.sh complete."
fi

# ── Phase 3: DNS verification ────────────────────────────────────────────────
heading "Phase 3/7: DNS resolves to this machine"
if [[ "${SKIP_DNS}" == true ]]; then
  warn "Skipping DNS check (--skip-dns)."
else
  # Public IP — multiple resolvers in case one is unreachable.
  public_ip=""
  for resolver in "https://api.ipify.org" "https://ifconfig.me" "https://ipv4.icanhazip.com"; do
    public_ip=$(curl -fsSL --max-time 5 "${resolver}" 2>/dev/null | tr -d '[:space:]' || true)
    [[ -n "${public_ip}" ]] && break
  done
  if [[ -z "${public_ip}" ]]; then
    error "Could not determine this machine's public IP. Pass --skip-dns to bypass if you've already verified."
    exit 4
  fi
  info "This machine's public IP: ${public_ip}"

  # Poll up to ~10 minutes (60 × 10s). Each iteration prints a single dot.
  echo -n "  Waiting for ${DOMAIN} -> ${public_ip}"
  for i in $(seq 1 60); do
    resolved=$(dig +short A "${DOMAIN}" @1.1.1.1 2>/dev/null | tail -1 || true)
    if [[ "${resolved}" == "${public_ip}" ]]; then
      echo
      info "DNS converged: ${DOMAIN} -> ${public_ip}"
      break
    fi
    echo -n "."
    sleep 10
    if [[ ${i} -eq 60 ]]; then
      echo
      error "DNS never converged. Got: '${resolved:-<empty>}'"
      error "Either update the A record and re-run, or pass --skip-dns if you've"
      error "staged the cert via a different path (DNS-01 challenge, manual upload)."
      exit 4
    fi
  done
fi

# ── Phase 4: TLS cert ────────────────────────────────────────────────────────
heading "Phase 4/7: Let's Encrypt certificate"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
if [[ "${SKIP_CERT}" == true ]]; then
  warn "Skipping certbot (--skip-cert)."
elif [[ -f "${CERT_PATH}" ]]; then
  # Reuse the existing cert; certbot will renew automatically via cron.
  info "Cert already present at ${CERT_PATH} — reusing."
else
  # Standalone mode binds :80 temporarily. nginx isn't up yet on a fresh box,
  # so this is safe. If something else is on :80, we abort rather than fight.
  if ss -lntp 2>/dev/null | awk '{print $4}' | grep -qE ':80$'; then
    error "Port 80 is in use by another process; certbot --standalone will fail."
    error "Either stop that process or use --skip-cert and run certbot manually."
    exit 5
  fi
  if ! certbot certonly --standalone --non-interactive --agree-tos \
       --email "concierge@${DOMAIN}" \
       -d "${DOMAIN}" -d "www.${DOMAIN}"; then
    error "Certbot failed. Common causes: DNS not propagated, rate-limited, port 80 blocked."
    exit 5
  fi
  info "Certificate issued for ${DOMAIN}."
fi

# ── Phase 5: Repo sync ───────────────────────────────────────────────────────
heading "Phase 5/7: Sync repo into ${DEPLOY_REPO}"
# Resolve the origin URL of the repo this script came from so the VPS clones
# from the same source (we can't hardcode it — open-source vs private may
# differ). Falls back to a hardcoded default if we somehow got here from a
# detached file.
ORIGIN_URL=$(cd "${REPO_DIR}" && git config --get remote.origin.url 2>/dev/null || echo "")
if [[ -z "${ORIGIN_URL}" ]]; then
  ORIGIN_URL="https://github.com/xnxchoi/thehideaway.git"
  warn "Could not detect repo origin; defaulting to ${ORIGIN_URL}"
fi

# Clone or pull as the deploy user (Docker group membership matters for prod.sh).
if [[ ! -d "${DEPLOY_REPO}/.git" ]]; then
  info "Cloning ${ORIGIN_URL} into ${DEPLOY_REPO}..."
  sudo -u deploy git clone "${ORIGIN_URL}" "${DEPLOY_REPO}"
else
  info "Repo already cloned at ${DEPLOY_REPO} — fetching latest..."
  sudo -u deploy git -C "${DEPLOY_REPO}" fetch --all --prune
  sudo -u deploy git -C "${DEPLOY_REPO}" pull --ff-only
fi

# ── Phase 6: Pre-flight ──────────────────────────────────────────────────────
heading "Phase 6/7: Pre-flight (.env.production + asset tree)"

ENV_FILE="${DEPLOY_REPO}/.env.production"
if [[ ! -f "${ENV_FILE}" ]]; then
  error ".env.production missing at ${ENV_FILE}."
  error "Copy it from your secure store (1Password / vault / scp from laptop)"
  error "and re-run. Template lives at ${DEPLOY_REPO}/.env.production.example."
  exit 3
fi
# Refuse to deploy with placeholder values still in the file.
if grep -E '^[A-Z_]+=(CHANGE_ME|your_|GOCSPX-your|pk\.your_)' "${ENV_FILE}" >/dev/null; then
  error ".env.production contains placeholder values:"
  grep -nE '^[A-Z_]+=(CHANGE_ME|your_|GOCSPX-your|pk\.your_)' "${ENV_FILE}" >&2
  error "Replace these with real values, then re-run."
  exit 3
fi
# Refuse if no PAYLOAD_SECRET / BETTER_AUTH_SECRET (catches an empty file).
for required_key in PAYLOAD_SECRET BETTER_AUTH_SECRET DATABASE_URI POSTGRES_PASSWORD; do
  if ! grep -qE "^${required_key}=." "${ENV_FILE}"; then
    error ".env.production missing required key: ${required_key}"
    exit 3
  fi
done
info ".env.production looks complete."

# Asset tree — fast and strict via asset-bootstrap.sh check.
if [[ -x "${DEPLOY_REPO}/scripts/asset-bootstrap.sh" ]]; then
  if ! "${DEPLOY_REPO}/scripts/asset-bootstrap.sh" check --quiet; then
    error "Asset tree under /opt/thehideaway/assets is incomplete."
    error "Run from your dev machine:"
    error "  rsync -av --progress ./public/assets/  deploy@<this-host>:/opt/thehideaway/assets/"
    error "Then re-run this script (or just re-run prod.sh)."
    exit 3
  fi
  info "Asset tree present."
else
  warn "asset-bootstrap.sh not found — skipping asset check."
fi

# Confirm the image is loadable BEFORE prod.sh tries to pull (which would
# otherwise fail at a less helpful stage).
REGISTRY="${REGISTRY:-hideaway}"
if ! docker image inspect "${REGISTRY}:${IMAGE_TAG}" >/dev/null 2>&1; then
  warn "Image ${REGISTRY}:${IMAGE_TAG} not present locally."
  warn "prod.sh will attempt to pull. If that fails:"
  warn "  • From your dev machine: docker save ${REGISTRY}:${IMAGE_TAG} | ssh root@<host> 'docker load'"
  warn "  • Or push to a registry the VPS can pull from."
  warn "Continuing — prod.sh will surface the real error if pull fails."
else
  info "Image ${REGISTRY}:${IMAGE_TAG} is loadable locally."
fi

# ── Phase 7: First deploy ────────────────────────────────────────────────────
heading "Phase 7/7: First deploy (network, migrate, up, health)"

# Docker network — prod.sh creates it via ensure_network, but creating it
# here surfaces permission/IPv6 issues before the larger up call.
if ! docker network ls --format '{{.Name}}' | grep -q '^hideaway$'; then
  info "Creating 'hideaway' Docker network (IPv6 enabled)..."
  docker network create --ipv6=true hideaway >/dev/null
fi

# Run prod.sh as deploy. --full = pull + deploy + migrate. First deploy is
# the canonical case for --full because the DB is fresh.
info "Running prod.sh --full as deploy user..."
(
  cd "${DEPLOY_REPO}"
  sudo -u deploy IMAGE_TAG="${IMAGE_TAG}" REGISTRY="${REGISTRY}" ./prod.sh --full
) || { error "prod.sh failed. Check logs above and 'docker compose logs'."; exit 6; }

# Health check — give nginx 30s to settle, then hit /privacy (a static
# server-rendered page that doesn't depend on the DB).
info "Smoke-testing /privacy over HTTPS..."
sleep 5
for i in $(seq 1 6); do
  if curl -fsS -o /dev/null --max-time 5 "https://${DOMAIN}/privacy"; then
    info "  ✓ /privacy responded 200"
    break
  fi
  sleep 5
  if [[ ${i} -eq 6 ]]; then
    error "Stack came up but https://${DOMAIN}/privacy did not respond."
    error "Diagnose: docker compose -f compose.prod.yaml logs --tail=100"
    exit 6
  fi
done

# Summary
echo
echo -e "${GREEN}${BOLD}✓ First deploy complete.${NC}"
echo
echo "Useful next steps:"
echo "  • Verify the running stack:  docker compose -f compose.prod.yaml ps"
echo "  • Tail logs:                 docker compose -f compose.prod.yaml logs -f payload"
echo "  • Open Dockge (optional):    ssh -L 5001:127.0.0.1:5001 deploy@${DOMAIN}"
echo "                               then: ${DEPLOY_REPO}/prod.sh dockge-up   (TODO if you want a wrapper)"
echo "  • Submit OAuth consoles:     see ${DEPLOY_REPO}/readmes/oauth-approval/"
echo "  • Capture prod screenshots:  see ${DEPLOY_REPO}/readmes/oauth-approval/03-pre-flight.md"
echo
