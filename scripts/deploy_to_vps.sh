#!/usr/bin/env bash
set -euo pipefail

# HMH Global: Deploy backend + frontend to Ubuntu VPS atomically
# Requirements on local: bash, ssh, rsync, node/npm installed
# Requirements on VPS: node/npm, pm2 (or systemd service), nginx serving /var/www/hmh-global/public
# Usage:
#   SSH_USER=ubuntu SSH_HOST=your.ip.or.host ./scripts/deploy_to_vps.sh
# Optional:
#   SSH_PORT=22 APP_NAME=hmh-backend REMOTE_BACKEND_DIR=/var/www/hmh-global REMOTE_FRONTEND_DIR=/var/www/hmh-global/public

SSH_USER="${SSH_USER:-ubuntu}"
SSH_HOST="${SSH_HOST:-}"  # required
SSH_PORT="${SSH_PORT:-22}"
APP_NAME="${APP_NAME:-hmh-backend}"
REMOTE_BACKEND_DIR="${REMOTE_BACKEND_DIR:-/var/www/hmh-global}"
REMOTE_FRONTEND_DIR="${REMOTE_FRONTEND_DIR:-/var/www/hmh-global/public}"

if [[ -z "$SSH_HOST" ]]; then
  echo "[deploy] ERROR: SSH_HOST is required (e.g. SSH_HOST=1.2.3.4)"
  exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/Frontend/hmh-global-frontend"

echo "[deploy] Building frontend"
pushd "$FRONTEND_DIR" >/dev/null
# Prefer CI for reproducibility
if command -v npm >/dev/null 2>&1; then
  npm ci || npm install
  npm run build
else
  echo "[deploy] ERROR: npm not found locally"
  exit 1
fi
popd >/dev/null

# Create remote directories
echo "[deploy] Ensuring remote directories exist"
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "sudo mkdir -p '$REMOTE_BACKEND_DIR' '$REMOTE_FRONTEND_DIR' && sudo chown -R \$USER: '$REMOTE_BACKEND_DIR' '$REMOTE_FRONTEND_DIR'"

# Sync frontend build to remote public dir
echo "[deploy] Syncing frontend build -> $REMOTE_FRONTEND_DIR"
rsync -az --delete -e "ssh -p $SSH_PORT" "$FRONTEND_DIR/build/" "$SSH_USER@$SSH_HOST:$REMOTE_FRONTEND_DIR/"

# Rsync backend source (exclude local node_modules and logs)
echo "[deploy] Syncing backend -> $REMOTE_BACKEND_DIR"
rsync -az -e "ssh -p $SSH_PORT" \
  --exclude "node_modules" \
  --exclude ".env.local" \
  --exclude ".env.development" \
  --exclude "*.log" \
  "$BACKEND_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_BACKEND_DIR/"

# Optionally sync uploads if present
if [[ -d "$BACKEND_DIR/uploads" ]]; then
  echo "[deploy] Syncing uploads"
  rsync -az -e "ssh -p $SSH_PORT" "$BACKEND_DIR/uploads/" "$SSH_USER@$SSH_HOST:$REMOTE_BACKEND_DIR/uploads/"
fi

# Install backend deps on server and restart process manager
echo "[deploy] Installing backend deps and restarting app"
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" bash -lc "\
  cd '$REMOTE_BACKEND_DIR' && \
  if command -v npm >/dev/null 2>&1; then \
    npm ci --only=production || npm install --production; \
  else \
    echo 'npm not found on server' && exit 1; \
  fi && \
  if command -v pm2 >/dev/null 2>&1; then \
    pm2 describe '$APP_NAME' >/dev/null 2>&1 && pm2 reload '$APP_NAME' || pm2 start index.js --name '$APP_NAME'; \
    pm2 save; \
  else \
    echo 'pm2 not found; attempting systemd restart if service exists'; \
    sudo systemctl restart hmh-backend.service || true; \
  fi"

# Basic health check (adjust if needed)
HEALTH_URL="http://$SSH_HOST:5000/api/health"
echo "[deploy] Health check: $HEALTH_URL"
if command -v curl >/dev/null 2>&1; then
  curl -fsS "$HEALTH_URL" || echo "[deploy] Health check failed (non-fatal). Verify backend manually."
else
  echo "[deploy] curl not found locally; skipping health check"
fi

echo "[deploy] Deployment complete."
