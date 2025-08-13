#!/usr/bin/env bash
set -euo pipefail

# Reset PM2 process to ensure backend runs from the correct directory with proper env
# Usage:
#   SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] \
#   [REMOTE_BACKEND_DIR=/var/www/hmh-global] ./scripts/hmh_pm2_reset_backend.sh

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}

info() { echo -e "\033[1;36m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }
require() { local n="$1"; local v="${!n:-}"; if [[ -z "$v" ]]; then err "Missing required env: $1"; exit 1; fi; }

require SSH_USER
require SSH_HOST

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

REMOTE_CMDS=$(cat <<'RCMDS'
set -euo pipefail
BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}
cd "$BACKEND_DIR"

# Show current .env (redacted) and confirm route presence
echo "[REMOTE] Backend dir: $(pwd)"
sed -E 's/^([^=]+)=.*/\1=***REDACTED***/' .env | sed -n '1,80p' || true
echo "[REMOTE] index.js md5 and size:"
if command -v md5sum >/dev/null 2>&1; then md5sum index.js 2>/dev/null || true; fi
stat -c '%n %s bytes %y' index.js 2>/dev/null || true
echo "[REMOTE] grep health routes in index.js:"
grep -n "api/health" index.js 2>/dev/null || true
grep -n "app.get('/health'" index.js 2>/dev/null || true
echo "[REMOTE] index.js HEAD (1..120):"
sed -n '1,120p' index.js 2>/dev/null || true

# Ensure dependencies (prod)
if command -v npm >/dev/null 2>&1; then
  echo "[REMOTE] Installing production dependencies (npm ci --omit=dev if lock exists)..."
  if [ -f package-lock.json ]; then npm ci --omit=dev || npm ci || true; else npm install --omit=dev || true; fi
fi

# Reset PM2 process
if command -v pm2 >/dev/null 2>&1; then
  echo "[REMOTE] Resetting PM2 app hmh-global ..."
  pm2 delete hmh-global || true
  # Start with proper cwd and env
  PORT=${PORT:-5000} NODE_ENV=production pm2 start index.js --name hmh-global --update-env --cwd "$BACKEND_DIR"
  pm2 save || true
  pm2 status || true
  pm2 describe hmh-global | sed -n '1,200p' || true
else
  echo "[REMOTE][ERROR] pm2 not found" >&2
  exit 1
fi

# Local health check
sleep 2
(curl -sS -i http://127.0.0.1:5000/api/health || true) | head -n 40
echo "---"
(curl -sS -i http://127.0.0.1:5000/health || true) | head -n 40
RCMDS
)

info "Resetting PM2 backend on server ..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR bash -s'" <<< "$REMOTE_CMDS"

info "Done."
