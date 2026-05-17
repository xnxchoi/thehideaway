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
#         --ghcr-user xnxchoi \
#         --ghcr-pat  ghp_xxxxxxxxxxxxxxxxxxxx
#
#   Options:
#     --deploy-key KEY       (required) The deploy user's SSH pubkey, passed
#                            through to server-setup.sh. Anything that
#                            authorized_keys accepts is fine.
#     --ghcr-user USER       (required unless --skip-ghcr) GitHub username
#                            that owns the PAT used to pull from ghcr.io.
#     --ghcr-pat  TOKEN      (required unless --skip-ghcr) Fine-grained PAT
#                            with `read:packages`. Stored in the deploy user's
#                            ~/.docker/config.json so subsequent pulls work.
#     --image-tag TAG        (default: latest) Image tag prod.sh will deploy.
#                            CI publishes both <short-sha> and `latest` on
#                            every push to the `deploy` branch — usually you
#                            leave this unset.
#     --registry REG         (default: ghcr.io/xnxchoi/hideaway) Image base
#                            without the :tag suffix.
#     --domain DOMAIN        (default: hideawayseoul.com) Domain to verify
#                            DNS for and request a TLS cert for.
#     --skip-dns             Bypass the DNS poll.
#     --skip-cert            Bypass certbot.
#     --skip-gh-key          Bypass the GitHub deploy key step.
#     --skip-ghcr            Bypass the ghcr.io login step (useful if auth
#                            is already configured for the deploy user).
#     --skip-setup           Bypass scripts/server-setup.sh.
#     -h | --help            Show this.
#
# ── What it does (each phase is idempotent) ──────────────────────────────────
#   1. Sanity — refuse to run anywhere that isn't a clean Ubuntu root shell.
#   2. server-setup.sh — OS hardening, Docker, certbot, deploy user.
#   3. DNS check — poll until $DOMAIN resolves to this machine's public IP.
#   4. TLS — certbot certonly --standalone for $DOMAIN.
#   5. GitHub auth — (a) generate ed25519 deploy key, print pubkey, pause for
#      you to paste it into the repo's Settings → Deploy keys; (b) docker
#      login ghcr.io with the supplied PAT so prod.sh can pull the image.
#   6. Repo sync — clone or fast-forward `deploy` branch into
#      /home/deploy/thehideaway as the deploy user.
#   7. Pre-flight — validate .env.production has no placeholders, asset tree
#      under /opt/thehideaway/assets is populated, and the image tag is
#      reachable on ghcr.io.
#   8. First deploy — ensure docker network, `prod.sh --full` (deploy +
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
#   7   GitHub SSH auth failed after deploy key was added

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
GHCR_USER=""
GHCR_PAT=""
IMAGE_TAG="latest"
REGISTRY="ghcr.io/xnxchoi/hideaway"
DEPLOY_BRANCH="deploy"
DOMAIN="hideawayseoul.com"
SKIP_DNS=false
SKIP_CERT=false
SKIP_GH_KEY=false
SKIP_GHCR=false
SKIP_SETUP=false

usage() { sed -n '2,/^set -Eeuo/p' "$0" | sed -n '2,/^$/p' | sed 's/^# \{0,1\}//'; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --deploy-key)  DEPLOY_KEY="$2";   shift 2 ;;
    --ghcr-user)   GHCR_USER="$2";    shift 2 ;;
    --ghcr-pat)    GHCR_PAT="$2";     shift 2 ;;
    --image-tag)   IMAGE_TAG="$2";    shift 2 ;;
    --registry)    REGISTRY="$2";     shift 2 ;;
    --branch)      DEPLOY_BRANCH="$2"; shift 2 ;;
    --domain)      DOMAIN="$2";       shift 2 ;;
    --skip-dns)    SKIP_DNS=true;     shift ;;
    --skip-cert)   SKIP_CERT=true;    shift ;;
    --skip-gh-key) SKIP_GH_KEY=true;  shift ;;
    --skip-ghcr)   SKIP_GHCR=true;    shift ;;
    --skip-setup)  SKIP_SETUP=true;   shift ;;
    -h|--help)     usage; exit 0 ;;
    *)             error "Unknown argument: $1 (try --help)"; exit 2 ;;
  esac
done

[[ -z "${DEPLOY_KEY}" ]] && { error "--deploy-key is required (see --help)"; exit 2; }
if [[ "${SKIP_GHCR}" != true ]]; then
  [[ -z "${GHCR_USER}" ]] && { error "--ghcr-user is required (or pass --skip-ghcr)"; exit 2; }
  [[ -z "${GHCR_PAT}"  ]] && { error "--ghcr-pat is required (or pass --skip-ghcr)";  exit 2; }
fi

# ── Phase 1: Sanity ──────────────────────────────────────────────────────────
heading "Phase 1/8: Sanity checks"
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
info "Domain:     ${BOLD}${DOMAIN}${NC}"
info "Registry:   ${BOLD}${REGISTRY}${NC}"
info "Image tag:  ${BOLD}${IMAGE_TAG}${NC}"
info "Branch:     ${BOLD}${DEPLOY_BRANCH}${NC}"

# ── Phase 2: server-setup.sh ─────────────────────────────────────────────────
heading "Phase 2/8: server-setup.sh (OS hardening, Docker, certbot)"
if [[ "${SKIP_SETUP}" == true ]]; then
  warn "Skipping server-setup.sh (--skip-setup). Assuming the box is provisioned."
else
  bash "${SCRIPT_DIR}/server-setup.sh" --deploy-key "${DEPLOY_KEY}"
  info "server-setup.sh complete."
fi

# ── Phase 3: DNS verification ────────────────────────────────────────────────
heading "Phase 3/8: DNS resolves to this machine"
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
heading "Phase 4/8: Let's Encrypt certificate"
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

# ── Phase 5: GitHub deploy key ───────────────────────────────────────────────
# Generate (or reuse) an ed25519 keypair owned by the deploy user, print the
# public half, pause for the operator to add it to the repo's Deploy Keys,
# then configure ssh_config so subsequent git operations use it. This
# unblocks the clone in phase 6 when origin is a private GitHub repo.
heading "Phase 5/8: GitHub deploy key (private-repo clone unblock)"

# Resolve origin URL early — we'll need it for the GitHub URL hint and for
# the actual clone in phase 6.
ORIGIN_URL=$(cd "${REPO_DIR}" && git config --get remote.origin.url 2>/dev/null || echo "")
if [[ -z "${ORIGIN_URL}" ]]; then
  ORIGIN_URL="https://github.com/xnxchoi/thehideaway.git"
  warn "Could not detect repo origin; defaulting to ${ORIGIN_URL}"
fi

# Extract owner/repo slug from either https or ssh form.
REPO_SLUG=""
if [[ "${ORIGIN_URL}" =~ ^https?://github\.com/([^/]+/[^/]+?)(\.git)?/?$ ]]; then
  REPO_SLUG="${BASH_REMATCH[1]}"
elif [[ "${ORIGIN_URL}" =~ ^git@github\.com:([^/]+/[^/]+?)(\.git)?$ ]]; then
  REPO_SLUG="${BASH_REMATCH[1]}"
fi

# Skip phase 5 if origin isn't on github.com or if explicitly skipped.
if [[ "${SKIP_GH_KEY}" == true ]]; then
  warn "Skipping GitHub deploy key step (--skip-gh-key)."
elif [[ -z "${REPO_SLUG}" ]]; then
  warn "Origin '${ORIGIN_URL}' isn't a github.com URL — skipping deploy-key phase."
  warn "If the source needs auth, configure ${DEPLOY_HOME}/.ssh/config manually."
else
  DEPLOY_SSH_DIR="${DEPLOY_HOME}/.ssh"
  DEPLOY_GH_KEY="${DEPLOY_SSH_DIR}/github"
  DEPLOY_SSH_CONFIG="${DEPLOY_SSH_DIR}/config"

  # Ensure ~/.ssh exists with deploy ownership + 0700 (server-setup.sh
  # created it for authorized_keys but be defensive on re-run).
  install -o deploy -g deploy -m 0700 -d "${DEPLOY_SSH_DIR}"

  # Generate (or reuse) the key. Reuse means rotation is opt-in (delete the
  # files manually to force regeneration).
  if [[ -f "${DEPLOY_GH_KEY}" && -f "${DEPLOY_GH_KEY}.pub" ]]; then
    info "GitHub deploy key already present at ${DEPLOY_GH_KEY} — reusing."
  else
    info "Generating ed25519 deploy key for github.com..."
    sudo -u deploy ssh-keygen -t ed25519 -N "" \
      -f "${DEPLOY_GH_KEY}" \
      -C "deploy@$(hostname -f 2>/dev/null || hostname) — ${DOMAIN}" \
      >/dev/null

    # Print the public half + paste instructions inside a hard-to-miss box.
    PUBKEY_CONTENT="$(cat "${DEPLOY_GH_KEY}.pub")"
    echo
    echo -e "${YELLOW}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}${BOLD}  ACTION REQUIRED — add this deploy key to GitHub before continuing${NC}"
    echo -e "${YELLOW}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo
    echo "  ${PUBKEY_CONTENT}"
    echo
    echo "  Paste it at:  https://github.com/${REPO_SLUG}/settings/keys/new"
    echo "  Title:        $(hostname) — deploy"
    echo "  Access:       ${BOLD}Leave 'Allow write access' UNCHECKED${NC} (read-only is enough)"
    echo
    echo -e "${YELLOW}${BOLD}══════════════════════════════════════════════════════════════════${NC}"
    echo
    read -r -p "Press Enter once the deploy key is added on GitHub... " _
  fi

  # Configure ssh_config so `git@github.com:...` uses this key. Idempotent.
  if ! sudo -u deploy grep -q "^Host github.com$" "${DEPLOY_SSH_CONFIG}" 2>/dev/null; then
    info "Writing ${DEPLOY_SSH_CONFIG} (github.com → ${DEPLOY_GH_KEY})..."
    sudo -u deploy tee -a "${DEPLOY_SSH_CONFIG}" >/dev/null <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ${DEPLOY_GH_KEY}
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
    sudo -u deploy chmod 600 "${DEPLOY_SSH_CONFIG}"
  fi

  # Pre-populate known_hosts so the accept-new doesn't prompt on first
  # connection (we're non-interactive here).
  if ! sudo -u deploy ssh-keygen -F github.com -f "${DEPLOY_SSH_DIR}/known_hosts" >/dev/null 2>&1; then
    info "Pre-populating known_hosts with GitHub's host keys..."
    sudo -u deploy bash -c "ssh-keyscan -H github.com >> '${DEPLOY_SSH_DIR}/known_hosts' 2>/dev/null"
    sudo -u deploy chmod 600 "${DEPLOY_SSH_DIR}/known_hosts"
  fi

  # Verify auth. `ssh -T git@github.com` always exits non-zero even on
  # success (GitHub doesn't grant a shell), so we grep the message instead.
  info "Verifying GitHub SSH auth..."
  auth_output="$(sudo -u deploy ssh -T -o BatchMode=yes git@github.com 2>&1 || true)"
  if echo "${auth_output}" | grep -qE "successfully authenticated"; then
    info "GitHub SSH auth verified."
  else
    error "GitHub SSH auth test failed. Output was:"
    echo "${auth_output}" | sed 's/^/    /' >&2
    error "Make sure the deploy key was pasted correctly at:"
    error "  https://github.com/${REPO_SLUG}/settings/keys"
    error "Then re-run with --skip-setup --skip-dns --skip-cert to retry just this phase."
    exit 7
  fi
fi

# ── Phase 5b: ghcr.io login (so prod.sh can pull the image) ──────────────────
# `docker login` writes ~/.docker/config.json for the user that ran it.
# We run it as the deploy user so subsequent `docker pull` (via prod.sh) works
# from the same identity.
if [[ "${SKIP_GHCR}" == true ]]; then
  warn "Skipping ghcr.io login (--skip-ghcr). prod.sh pull will fail if not already configured."
else
  info "Logging in to ghcr.io as ${GHCR_USER} (deploy user)..."
  # --password-stdin keeps the PAT out of process listings / shell history.
  if ! printf '%s' "${GHCR_PAT}" | sudo -u deploy docker login ghcr.io \
        --username "${GHCR_USER}" --password-stdin >/dev/null; then
    error "ghcr.io login failed. Check that the PAT has 'read:packages' scope"
    error "and that the user '${GHCR_USER}' has pull access to ${REGISTRY}."
    exit 7
  fi
  info "ghcr.io login persisted to /home/deploy/.docker/config.json"
fi

# ── Phase 6: Repo sync ───────────────────────────────────────────────────────
heading "Phase 6/8: Sync repo into ${DEPLOY_REPO} (branch: ${DEPLOY_BRANCH})"

# Rewrite https://github.com/owner/repo[.git] → git@github.com:owner/repo.git
# so the clone uses the deploy key configured above. Leaves non-GitHub URLs
# untouched.
if [[ -n "${REPO_SLUG}" && "${ORIGIN_URL}" =~ ^https?:// ]]; then
  CLONE_URL="git@github.com:${REPO_SLUG}.git"
  info "Using SSH clone URL: ${CLONE_URL}"
else
  CLONE_URL="${ORIGIN_URL}"
fi

# Clone or pull as the deploy user (Docker group membership matters for prod.sh).
# Branch: ${DEPLOY_BRANCH} — the lean, ghcr.io-buildable branch (typically `deploy`).
if [[ ! -d "${DEPLOY_REPO}/.git" ]]; then
  info "Cloning ${CLONE_URL} (branch: ${DEPLOY_BRANCH}) into ${DEPLOY_REPO}..."

  # If the operator pre-staged .env.production in the target dir (per
  # LAUNCH.md Step 3), `git clone` will refuse a non-empty target. Move
  # the env file aside, clone, move it back.
  STAGED_ENV=""
  if [[ -f "${DEPLOY_REPO}/.env.production" ]]; then
    STAGED_ENV="$(mktemp)"
    info "Pre-staged .env.production found — preserving across clone."
    mv "${DEPLOY_REPO}/.env.production" "${STAGED_ENV}"
  fi

  # Clone needs an empty dir; on a fresh box server-setup.sh created the dir
  # empty, but on re-runs it may contain stray files — fail loudly rather
  # than silently nuking unrecognized content.
  if [[ -d "${DEPLOY_REPO}" ]] && [[ -n "$(ls -A "${DEPLOY_REPO}" 2>/dev/null || true)" ]]; then
    error "${DEPLOY_REPO} exists and is not empty. Inspect and clear it before re-running."
    [[ -n "${STAGED_ENV}" ]] && error "Pre-staged env saved to ${STAGED_ENV}."
    exit 1
  fi

  sudo -u deploy git clone --branch "${DEPLOY_BRANCH}" "${CLONE_URL}" "${DEPLOY_REPO}"

  if [[ -n "${STAGED_ENV}" ]]; then
    info "Restoring pre-staged .env.production into the clone."
    install -o deploy -g deploy -m 600 "${STAGED_ENV}" "${DEPLOY_REPO}/.env.production"
    rm -f "${STAGED_ENV}"
  fi
else
  info "Repo already cloned at ${DEPLOY_REPO} — fetching latest..."
  current_origin=$(sudo -u deploy git -C "${DEPLOY_REPO}" config --get remote.origin.url || echo "")
  if [[ "${current_origin}" != "${CLONE_URL}" ]]; then
    info "Updating remote.origin.url: ${current_origin} → ${CLONE_URL}"
    sudo -u deploy git -C "${DEPLOY_REPO}" remote set-url origin "${CLONE_URL}"
  fi
  sudo -u deploy git -C "${DEPLOY_REPO}" fetch --all --prune
  current_branch=$(sudo -u deploy git -C "${DEPLOY_REPO}" rev-parse --abbrev-ref HEAD)
  if [[ "${current_branch}" != "${DEPLOY_BRANCH}" ]]; then
    info "Switching from ${current_branch} to ${DEPLOY_BRANCH}..."
    sudo -u deploy git -C "${DEPLOY_REPO}" checkout "${DEPLOY_BRANCH}"
  fi
  sudo -u deploy git -C "${DEPLOY_REPO}" pull --ff-only
fi

# ── Phase 7: Pre-flight ──────────────────────────────────────────────────────
heading "Phase 7/8: Pre-flight (.env.production + asset tree + image manifests)"

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

# Confirm BOTH images (runtime + migrate) are reachable on ghcr.io BEFORE
# prod.sh tries to pull. `docker manifest inspect` hits the registry HEAD
# without downloading layers, so it surfaces auth + missing-tag failures
# cheaply. We keep stderr so 401 (auth) is distinguishable from 404 (missing).
check_manifest() {
  local image="$1"
  local out
  if out=$(sudo -u deploy docker manifest inspect "${image}" 2>&1 >/dev/null); then
    info "  ✓ ${image}"
    return 0
  fi
  error "Could not fetch manifest for ${image}."
  echo "${out}" | sed 's/^/    /' >&2
  if echo "${out}" | grep -qiE "unauthorized|denied|forbidden"; then
    error "Looks like an AUTH failure. Verify the PAT:"
    error "  sudo -u deploy docker login ghcr.io   # should succeed"
    error "  PAT needs 'read:packages' AND access granted to this specific package."
    error "  At https://github.com/users/${GHCR_USER:-xnxchoi}/packages/container/${image##*/}/settings"
    error "  ensure visibility is correct (private packages need explicit PAT access)."
  elif echo "${out}" | grep -qiE "manifest unknown|not found"; then
    error "Tag does not exist on the registry."
    error "  Check Actions: https://github.com/${REPO_SLUG:-xnxchoi/thehideaway}/actions"
    error "  If using --image-tag <sha>, make sure that SHA was built and published."
  fi
  return 1
}

info "Checking image manifests on the registry..."
check_manifest "${REGISTRY}:${IMAGE_TAG}"          || exit 3
check_manifest "${REGISTRY}-migrate:${IMAGE_TAG}"  || exit 3

# ── Phase 8: First deploy ────────────────────────────────────────────────────
heading "Phase 8/8: First deploy (network, migrate, up, health)"

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
