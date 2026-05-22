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
#   As root on the VPS, from the cloned repo. The ghcr.io PAT is read from
#   the GHCR_TOKEN environment variable — NEVER passed as a CLI flag, because
#   CLI args are visible in `ps aux` for the duration of the script.
#
#     GHCR_TOKEN="$(cat ~/.ghcr-token)" \
#       bash scripts/first-deploy.sh \
#         --deploy-key "ssh-ed25519 AAAA... your-pubkey" \
#         --image-tag v1.2.3 \
#         --ghcr-user xnxchoi
#
#   Options:
#     --deploy-key KEY       (required) The deploy user's SSH pubkey, passed
#                            through to server-setup.sh. Anything that
#                            authorized_keys accepts is fine.
#     --image-tag TAG        (required) Semver tag published to ghcr.io by the
#                            release workflow (e.g. v1.2.3). Or the literal
#                            "latest". scripts/deploy.sh validates the manifest
#                            exists on ghcr.io BEFORE touching the running stack.
#     --ghcr-user USER       (required) GitHub username/org that owns the
#                            ghcr.io packages. Used for `docker login ghcr.io`
#                            as the deploy user.
#
#   Environment variables:
#     GHCR_TOKEN             (required) Classic PAT (NOT fine-grained) with
#                            `read:packages` scope. Fine-grained tokens do not
#                            support the GitHub Packages API. See readmes/DEPLOY.md.
#     --domain DOMAIN        (default: hideawayseoul.com) Domain to verify
#                            DNS for and request a TLS cert for.
#     --skip-dns             Bypass the DNS poll (useful if you know DNS is
#                            slow and you've staged the cert another way).
#     --skip-cert            Bypass certbot (useful if cert already exists
#                            at /etc/letsencrypt/live/$DOMAIN/).
#     --skip-gh-key          Bypass the GitHub deploy key step (useful if
#                            the deploy user already has a working ssh
#                            identity for github.com).
#     --skip-setup           Bypass scripts/server-setup.sh (re-run only the
#                            deploy bits on an already-provisioned box).
#     -h | --help            Show this.
#
# ── What it does (each phase is idempotent) ──────────────────────────────────
#   1. Sanity — refuse to run anywhere that isn't a clean Ubuntu root shell.
#   2. server-setup.sh — OS hardening, Docker, certbot, deploy user,
#      /etc/age/, sops + age binaries.
#   3. DNS check — poll until $DOMAIN resolves to this machine's public IP.
#   4. TLS — certbot certonly --standalone for $DOMAIN.
#   5a. GitHub deploy key — generate ed25519, print pubkey, pause for you to
#       paste it into the repo's Settings → Deploy keys, verify SSH auth.
#   5b. ghcr.io login — `docker login ghcr.io` as the deploy user.
#   6. Repo sync — clone or fast-forward into /home/deploy/thehideaway as
#      the deploy user.
#   7. Pre-flight — validate /etc/age/keys.txt exists, .env.production.enc
#      decrypts cleanly, the asset tree is populated, and the requested
#      image tag exists on ghcr.io.
#   8. First deploy — ensure docker network, `scripts/deploy.sh <tag>
#      --migrate`. Then health-check by hitting the local nginx.
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
IMAGE_TAG=""
GHCR_USER=""
# GHCR_TOKEN comes from the environment, NOT from argv. Read it now before
# anything else so we can fail fast with a clear hint.
GHCR_TOKEN="${GHCR_TOKEN:-}"
DOMAIN="hideawayseoul.com"
SKIP_DNS=false
SKIP_CERT=false
SKIP_GH_KEY=false
SKIP_SETUP=false

usage() { sed -n '2,/^set -Eeuo/p' "$0" | sed -n '2,/^$/p' | sed 's/^# \{0,1\}//'; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --deploy-key)  DEPLOY_KEY="$2";   shift 2 ;;
    --image-tag)   IMAGE_TAG="$2";    shift 2 ;;
    --ghcr-user)   GHCR_USER="$2";    shift 2 ;;
    --ghcr-token)
      error "--ghcr-token is no longer accepted as a CLI flag (it would leak via 'ps aux')."
      error "Pass it via the GHCR_TOKEN environment variable instead:"
      error "  GHCR_TOKEN=\"\$(cat ~/.ghcr-token)\" bash scripts/first-deploy.sh ..."
      exit 2
      ;;
    --domain)      DOMAIN="$2";       shift 2 ;;
    --skip-dns)    SKIP_DNS=true;     shift ;;
    --skip-cert)   SKIP_CERT=true;    shift ;;
    --skip-gh-key) SKIP_GH_KEY=true;  shift ;;
    --skip-setup)  SKIP_SETUP=true;   shift ;;
    -h|--help)     usage; exit 0 ;;
    *)             error "Unknown argument: $1 (try --help)"; exit 2 ;;
  esac
done

[[ -z "${DEPLOY_KEY}" ]] && { error "--deploy-key is required (see --help)"; exit 2; }
[[ -z "${IMAGE_TAG}"  ]] && { error "--image-tag is required (see --help)"; exit 2; }
[[ -z "${GHCR_USER}"  ]] && { error "--ghcr-user is required (see --help)"; exit 2; }
if [[ -z "${GHCR_TOKEN}" ]]; then
  error "GHCR_TOKEN env var is required."
  error "  GHCR_TOKEN=\"\$(cat ~/.ghcr-token)\" bash scripts/first-deploy.sh ..."
  exit 2
fi

# Tag format: semver (vMAJOR.MINOR.PATCH[-pre]) or the literal "latest".
if [[ "${IMAGE_TAG}" != "latest" && ! "${IMAGE_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  error "--image-tag must be semver (vMAJOR.MINOR.PATCH) or 'latest', got: ${IMAGE_TAG}"
  exit 2
fi

# Image refs — driven by GHCR_USER. scripts/deploy.sh respects ${REGISTRY}.
REGISTRY="${REGISTRY:-ghcr.io/${GHCR_USER}/hideaway}"

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
info "Domain: ${BOLD}${DOMAIN}${NC}"
info "Image tag: ${BOLD}${IMAGE_TAG}${NC}"

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
if [[ "${ORIGIN_URL}" =~ ^https?://github\.com/([^/]+/[^/]+)/?$ ]]; then
  REPO_SLUG="${BASH_REMATCH[1]}"
elif [[ "${ORIGIN_URL}" =~ ^git@github\.com:([^/]+/[^/]+)$ ]]; then
  REPO_SLUG="${BASH_REMATCH[1]}"
fi
# Bash ERE has no lazy quantifiers, so a trailing-`.git` optional group never
# actually strips the suffix — the greedy [^/]+ swallows ".git" into the slug.
# Strip it explicitly so CLONE_URL doesn't come out as "...thehideaway.git.git".
REPO_SLUG="${REPO_SLUG%.git}"

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

# ── Phase 5b: ghcr.io login (deploy user) ────────────────────────────────────
heading "Phase 5b/8: ghcr.io docker login (deploy user)"

# Login as the deploy user — that's the account scripts/deploy.sh runs under.
# --password-stdin avoids the token landing in shell history.
# Capture stderr so the operator sees docker's actual failure reason (401 vs
# network vs malformed username) instead of just our hint.
docker_login_err=""
if ! docker_login_err="$(echo "${GHCR_TOKEN}" | sudo -u deploy docker login ghcr.io \
     --username "${GHCR_USER}" --password-stdin 2>&1 >/dev/null)"; then
  error "docker login ghcr.io failed for ${GHCR_USER}:"
  echo "${docker_login_err}" | sed 's/^/    /' >&2
  error ""
  error "Most common cause: the PAT lacks explicit per-package access. Visit:"
  error "  https://github.com/users/${GHCR_USER}/packages/container/hideaway/settings"
  error "  https://github.com/users/${GHCR_USER}/packages/container/hideaway-migrate/settings"
  error "and add your PAT under 'Manage installed' with Read access."
  exit 7
fi
info "deploy user authenticated to ghcr.io as ${GHCR_USER}"

# ── Phase 6: Repo sync ───────────────────────────────────────────────────────
heading "Phase 6/8: Sync repo into ${DEPLOY_REPO}"

# Rewrite https://github.com/owner/repo[.git] → git@github.com:owner/repo.git
# so the clone uses the deploy key configured above. Leaves non-GitHub URLs
# untouched.
if [[ -n "${REPO_SLUG}" && "${ORIGIN_URL}" =~ ^https?:// ]]; then
  CLONE_URL="git@github.com:${REPO_SLUG}.git"
  info "Using SSH clone URL: ${CLONE_URL}"
else
  CLONE_URL="${ORIGIN_URL}"
fi

# Clone or pull as the deploy user (Docker group membership matters because
# scripts/deploy.sh later runs as deploy and needs to talk to the Docker socket).
if [[ ! -d "${DEPLOY_REPO}/.git" ]]; then
  info "Cloning ${CLONE_URL} into ${DEPLOY_REPO}..."
  if [[ -d "${DEPLOY_REPO}" && -n "$(ls -A "${DEPLOY_REPO}" 2>/dev/null)" ]]; then
    # server-setup.sh pre-creates subdirs inside the repo path — nginx/logs is
    # a bind-mount target in compose.prod.yaml and must exist before the stack
    # starts. `git clone` refuses a non-empty target, so clone into a temp dir
    # and merge it in; the pre-existing gitignored subdirs stay.
    warn "${DEPLOY_REPO} is non-empty (server-setup.sh pre-created subdirs) — clone-and-merge."
    # `install -d` leaves intermediate dirs (e.g. .../thehideaway/nginx)
    # root-owned — only the final named component gets -o/-g. Re-own the whole
    # tree to deploy so the merge below can write into every subdir.
    chown -R deploy:deploy "${DEPLOY_REPO}"
    CLONE_TMP="$(sudo -u deploy mktemp -d /home/deploy/.hideaway-clone.XXXXXX)"
    sudo -u deploy git clone "${CLONE_URL}" "${CLONE_TMP}"
    sudo -u deploy cp -aT "${CLONE_TMP}" "${DEPLOY_REPO}"
    rm -rf "${CLONE_TMP}"
  else
    sudo -u deploy git clone "${CLONE_URL}" "${DEPLOY_REPO}"
  fi
else
  info "Repo already cloned at ${DEPLOY_REPO} — fetching latest..."
  # Make sure the remote URL matches CLONE_URL on re-run (in case origin
  # was first cloned via https and we've now configured the deploy key).
  current_origin=$(sudo -u deploy git -C "${DEPLOY_REPO}" config --get remote.origin.url || echo "")
  if [[ "${current_origin}" != "${CLONE_URL}" ]]; then
    info "Updating remote.origin.url: ${current_origin} → ${CLONE_URL}"
    sudo -u deploy git -C "${DEPLOY_REPO}" remote set-url origin "${CLONE_URL}"
  fi
  sudo -u deploy git -C "${DEPLOY_REPO}" fetch --all --prune
  sudo -u deploy git -C "${DEPLOY_REPO}" pull --ff-only
fi

# ── Phase 7: Pre-flight ──────────────────────────────────────────────────────
heading "Phase 7/8: Pre-flight (age key, encrypted env, assets, image manifest)"

# 7.1 — age private key present, owned root:deploy, mode 640.
# scripts/deploy.sh runs as the (non-root) deploy user and reads this key via
# `deploy` group membership, so root:deploy 640 is the only correct resting
# state. Any other ownership or mode is corrected here — a plain `scp` as root
# typically leaves the file root:root 600, which the deploy user cannot read.
AGE_KEY_FILE="/etc/age/keys.txt"
if [[ ! -f "${AGE_KEY_FILE}" ]]; then
  error "${AGE_KEY_FILE} not found."
  error "scp the key from your laptop, then set ownership and mode:"
  error "  scp ~/.config/sops/age/keys.txt root@${DOMAIN}:${AGE_KEY_FILE}"
  error "  ssh root@${DOMAIN} 'chown root:deploy ${AGE_KEY_FILE} && chmod 640 ${AGE_KEY_FILE}'"
  exit 3
fi
AGE_KEY_OWNER="$(stat -c '%U:%G' "${AGE_KEY_FILE}")"
AGE_KEY_MODE="$(stat -c '%a' "${AGE_KEY_FILE}")"
if [[ "${AGE_KEY_OWNER}" != "root:deploy" || "${AGE_KEY_MODE}" != "640" ]]; then
  warn "${AGE_KEY_FILE} is ${AGE_KEY_OWNER} ${AGE_KEY_MODE} — correcting to root:deploy 640."
  chown root:deploy "${AGE_KEY_FILE}"
  chmod 640 "${AGE_KEY_FILE}"
fi
info "age key present at ${AGE_KEY_FILE} (root:deploy 640)"

# 7.2 — encrypted env file exists in the cloned repo.
ENV_ENC="${DEPLOY_REPO}/.env.production.enc"
if [[ ! -f "${ENV_ENC}" ]]; then
  error ".env.production.enc missing at ${ENV_ENC}."
  error "Has the repo been cloned with the latest commit? Phase 6 should have done that."
  exit 3
fi

# 7.3 — decrypt to a temp file and validate against the Zod schema.
ENV_CHECK="$(mktemp /tmp/hideaway-env-check.XXXXXX)"
chmod 600 "${ENV_CHECK}"
cleanup_env_check() {
  if command -v shred >/dev/null 2>&1; then
    shred -u "${ENV_CHECK}" 2>/dev/null || rm -f "${ENV_CHECK}"
  else
    rm -f "${ENV_CHECK}"
  fi
}
trap cleanup_env_check EXIT

if ! SOPS_AGE_KEY_FILE="${AGE_KEY_FILE}" \
     sops --decrypt --input-type dotenv --output-type dotenv "${ENV_ENC}" \
       > "${ENV_CHECK}" 2>/tmp/hideaway-sops-err.log; then
  error "sops failed to decrypt ${ENV_ENC}:"
  sed 's/^/    /' /tmp/hideaway-sops-err.log >&2
  rm -f /tmp/hideaway-sops-err.log
  exit 3
fi
info ".env.production.enc decrypted ($(wc -l < "${ENV_CHECK}") lines)"

# 7.4 — schema gate. Uses the repo's own verify-env script so failure messages
# match what the operator sees in `pnpm release:check`. Runs as root (the
# script is in a root phase) so it can read the root-owned ENV_CHECK temp
# file. The decrypted env never reaches the deploy user.
if ! (cd "${DEPLOY_REPO}" && node \
      --no-warnings --experimental-strip-types \
      scripts/verify-env.ts "${ENV_CHECK}"); then
  error "Env schema validation failed. Edit on the laptop:"
  error "  pnpm env:edit  →  fix the reported keys  →  commit  →  pnpm release:cut"
  exit 3
fi

# 7.5 — Asset tree — fast and strict via asset-bootstrap.sh check.
if [[ -x "${DEPLOY_REPO}/scripts/asset-bootstrap.sh" ]]; then
  if ! "${DEPLOY_REPO}/scripts/asset-bootstrap.sh" check --quiet; then
    error "Asset tree under /opt/thehideaway/assets is incomplete."
    error "Run from your dev machine:"
    error "  rsync -av --progress ./public/assets/  deploy@<this-host>:/opt/thehideaway/assets/"
    error "Then re-run this script with --skip-setup --skip-dns --skip-cert --skip-gh-key."
    exit 3
  fi
  info "Asset tree present."
else
  warn "asset-bootstrap.sh not found — skipping asset check."
fi

# 7.6 — Image manifest on ghcr.io. Catches the wrong tag / unbuilt-yet case
# before scripts/deploy.sh tears down the (non-existent) running stack.
# Capture stderr so a 401 (token has no package access) doesn't masquerade
# as a 404 (tag doesn't exist).
manifest_err=""
if manifest_err="$(sudo -u deploy docker manifest inspect \
     "${REGISTRY}:${IMAGE_TAG}" 2>&1 >/dev/null)"; then
  info "image manifest found: ${REGISTRY}:${IMAGE_TAG}"
else
  error "${REGISTRY}:${IMAGE_TAG} not accessible on ghcr.io:"
  echo "${manifest_err}" | sed 's/^/    /' >&2
  error ""
  error "Check that the release workflow finished green:"
  error "  https://github.com/${REPO_SLUG:-<owner>/<repo>}/actions"
  error "If the tag exists, the deploy user's PAT may lack package access."
  exit 3
fi

# ── Phase 8: First deploy ────────────────────────────────────────────────────
heading "Phase 8/8: First deploy (network, pull, up, migrate, health)"

# Docker network — compose.prod.yaml declares it as `external: true`, so it
# must exist before the first up. scripts/deploy.sh doesn't create it
# (intentionally — it's a once-per-VPS setup concern).
if ! docker network ls --format '{{.Name}}' | grep -q '^hideaway$'; then
  info "Creating 'hideaway' Docker network (IPv6 enabled)..."
  docker network create --ipv6=true hideaway >/dev/null
fi

# Hand off to scripts/deploy.sh as the deploy user. --migrate runs the
# (always-empty) initial migration set, with pg_dump-before pattern.
info "Running scripts/deploy.sh ${IMAGE_TAG} --migrate as deploy user..."
(
  cd "${DEPLOY_REPO}"
  sudo -u deploy REGISTRY="${REGISTRY}" DOMAIN="${DOMAIN}" \
    ./scripts/deploy.sh "${IMAGE_TAG}" --migrate
) || { error "scripts/deploy.sh failed. Check logs above and 'docker compose logs'."; exit 6; }

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
echo "  • Subsequent deploys:        ./scripts/deploy.sh <tag> [--migrate]"
echo "  • Check current tag:         ./scripts/deploy.sh --status"
echo "  • Roll back if needed:       ./scripts/deploy.sh --rollback"
echo "  • Edit env later:            (on laptop) pnpm env:edit"
echo "  • Submit OAuth consoles:     see ${DEPLOY_REPO}/readmes/oauth-approval/"
echo
