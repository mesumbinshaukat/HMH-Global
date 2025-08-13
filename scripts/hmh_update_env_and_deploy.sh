#!/usr/bin/env bash
set -euo pipefail

# Update production backend .env from local Backend/.env and redeploy backend only
# Usage:
#   SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] \
#   [FRONTEND_URL=https://hmhglobal.co.uk] ./scripts/hmh_update_env_and_deploy.sh

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}
LOCAL_ENV_PATH=${LOCAL_ENV_PATH:-Backend/.env}
FRONTEND_URL_OVERRIDE=${FRONTEND_URL:-}

info() { echo -e "\033[1;36m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }
require() { local n="$1"; local v="${!n:-}"; if [[ -z "$v" ]]; then err "Missing required env: $1"; exit 1; fi; }

require SSH_USER
require SSH_HOST

if [[ ! -f "$LOCAL_ENV_PATH" ]]; then
  err "Local env file not found: $LOCAL_ENV_PATH"
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Prepare sanitized env: start from local, ensure NODE_ENV=production and FRONTEND_URL set
NEW_ENV="$TMP_DIR/.env.new"
cp "$LOCAL_ENV_PATH" "$NEW_ENV"
# Ensure keys exist or are replaced
if grep -q '^NODE_ENV=' "$NEW_ENV"; then
  sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$NEW_ENV"
else
  echo 'NODE_ENV=production' >> "$NEW_ENV"
fi
# FRONTEND_URL: preserve override if provided; otherwise we'll try to keep remote value
if [[ -n "$FRONTEND_URL_OVERRIDE" ]]; then
  if grep -q '^FRONTEND_URL=' "$NEW_ENV"; then
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL_OVERRIDE|" "$NEW_ENV"
  else
    echo "FRONTEND_URL=$FRONTEND_URL_OVERRIDE" >> "$NEW_ENV"
  fi
fi

# Build SSH/SCP opts
SSH_OPTS=(-p "$SSH_PORT")
SCP_OPTS=(-P "$SSH_PORT")
if [[ -n "$SSH_KEY" && -f "$SSH_KEY" ]]; then
  SSH_OPTS=(-i "$SSH_KEY" -p "$SSH_PORT")
  SCP_OPTS=(-i "$SSH_KEY" -P "$SSH_PORT")
else
  warn "SSH key not provided or not found; will prompt for password."
  SSH_OPTS=(-p "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
  SCP_OPTS=(-P "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
fi

info "Uploading new .env to server (to /tmp) ..."
scp "${SCP_OPTS[@]}" "$NEW_ENV" "$SSH_USER@$SSH_HOST:/tmp/hmh_env_new"

# On server: backup existing .env, optionally preserve existing FRONTEND_URL if not overridden, then install new .env
REMOTE_CMD=$(cat <<'RSCRIPT'
set -euo pipefail
REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}
ENV_PATH="$REMOTE_BACKEND_DIR/.env"
PRESERVE_FRONTEND_URL="$PRESERVE_FRONTEND_URL"

if [[ -f "$ENV_PATH" ]]; then
  cp "$ENV_PATH" "$ENV_PATH.bak.$(date +%Y%m%d-%H%M%S)"
fi

# If not overriding FRONTEND_URL, try to carry over existing value
if [[ -z "$PRESERVE_FRONTEND_URL" && -f "$ENV_PATH" ]]; then
  EXISTING_FE=$(grep -E '^FRONTEND_URL=' "$ENV_PATH" | head -n1 || true)
else
  EXISTING_FE=""
fi

install_env() {
  mkdir -p "$REMOTE_BACKEND_DIR"
  mv /tmp/hmh_env_new "$ENV_PATH"
}

install_env

# Normalize required keys
if grep -q '^NODE_ENV=' "$ENV_PATH"; then
  sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$ENV_PATH"
else
  echo 'NODE_ENV=production' >> "$ENV_PATH"
fi

if [[ -n "$EXISTING_FE" ]]; then
  # Only set if user didn't override remotely via PRESERVE_FRONTEND_URL var
  if grep -q '^FRONTEND_URL=' "$ENV_PATH"; then
    # Preserve existing FE value from before backup
    sed -i "s|^FRONTEND_URL=.*|$EXISTING_FE|" "$ENV_PATH"
  else
    echo "$EXISTING_FE" >> "$ENV_PATH"
  fi
fi

echo "[REMOTE] Installed .env (sensitive values not shown)."

# Show redacted keys for verification
sed -E 's/^([^=]+)=.*/\1=***REDACTED***/' "$ENV_PATH" | sed -n '1,120p'

# Quick check: ensure MONGO_URI present
if ! grep -qE '^(MONGO_URI|MONGODB_URI)=' "$ENV_PATH"; then
  echo "[REMOTE][ERROR] MONGO_URI missing in .env" >&2
  exit 1
fi
RSCRIPT
)

info "Installing new .env on server ..."
# Pass PRESERVE_FRONTEND_URL empty unless we set an override locally
PRES_ARG=""
if [[ -z "$FRONTEND_URL_OVERRIDE" ]]; then PRES_ARG="PRESERVE_FRONTEND_URL="; else PRES_ARG="PRESERVE_FRONTEND_URL=1"; fi
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR $PRES_ARG bash -s'" <<< "$REMOTE_CMD"

# Now redeploy backend only (no frontend build) using existing deploy script
info "Redeploying backend (backend-only) ..."
BACKEND_ONLY=1 SSH_USER="$SSH_USER" SSH_HOST="$SSH_HOST" SSH_PORT="$SSH_PORT" SSH_KEY="$SSH_KEY" REMOTE_BACKEND_DIR="$REMOTE_BACKEND_DIR" ./scripts/hmh_deploy.sh

# Post-deploy health checks
info "Running post-deploy health checks ..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'set -e; (curl -sS -i http://127.0.0.1:5000/api/health || true) | head -n 40; (curl -sS -i http://127.0.0.1/api/health || true) | head -n 40'"

info "Done."
