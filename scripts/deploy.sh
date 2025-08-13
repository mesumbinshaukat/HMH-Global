#!/usr/bin/env bash
set -euo pipefail

# HMH Global deployment script (frontend + backend)
# Usage:
#   SSH_USER=ubuntu SSH_HOST=your.server SSH_PORT=22 SSH_KEY=~/.ssh/id_rsa \
#   ./scripts/deploy.sh
# Requires: bash, zip, scp/ssh on local; unzip, node/npm, pm2 or systemd on server

REMOTE_ROOT=${REMOTE_ROOT:-/var/www/hmh-global}
REMOTE_FRONTEND_DIR="$REMOTE_ROOT/public"
REMOTE_BACKEND_DIR="$REMOTE_ROOT"
BUILD_DIR_FRONTEND="Frontend/hmh-global-frontend"
BACKEND_DIR="Backend"

info() { echo -e "\033[1;36m[INFO]\033[0m $*"; }
err() { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    err "Missing required env var: $name"; exit 1;
  fi
}

require_env SSH_USER
require_env SSH_HOST
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-$HOME/.ssh/id_rsa}

info "Building frontend..."
pushd "$BUILD_DIR_FRONTEND" >/dev/null
npm ci
npm run build
popd >/dev/null

info "Preparing artifacts..."
rm -f /tmp/hmh-frontend.zip /tmp/hmh-backend.zip || true
pushd "$BUILD_DIR_FRONTEND" >/dev/null
zip -qr /tmp/hmh-frontend.zip build
popd >/dev/null

pushd "$BACKEND_DIR" >/dev/null
zip -qr /tmp/hmh-backend.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "uploads/*" \
  -x "*.log" \
  -x ".env*"
popd >/dev/null

info "Uploading artifacts to $SSH_USER@$SSH_HOST:$REMOTE_ROOT ..."
scp -i "$SSH_KEY" -P "$SSH_PORT" /tmp/hmh-frontend.zip "$SSH_USER@$SSH_HOST:/tmp/hmh-frontend.zip"
scp -i "$SSH_KEY" -P "$SSH_PORT" /tmp/hmh-backend.zip  "$SSH_USER@$SSH_HOST:/tmp/hmh-backend.zip"

info "Deploying on server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" bash -s <<'REMOTE_EOF'
set -euo pipefail
REMOTE_ROOT=${REMOTE_ROOT:-/var/www/hmh-global}
REMOTE_FRONTEND_DIR="$REMOTE_ROOT/public"
REMOTE_BACKEND_DIR="$REMOTE_ROOT"

sudo mkdir -p "$REMOTE_FRONTEND_DIR" "$REMOTE_BACKEND_DIR"
sudo chown -R "$USER":"$USER" "$REMOTE_ROOT"

# Frontend
rm -rf "$REMOTE_FRONTEND_DIR"/*
unzip -qo /tmp/hmh-frontend.zip -d /tmp/hmh-frontend
rsync -a --delete /tmp/hmh-frontend/build/ "$REMOTE_FRONTEND_DIR"/
rm -rf /tmp/hmh-frontend /tmp/hmh-frontend.zip

# Backend (atomic swap)
mkdir -p /tmp/hmh-backend
unzip -qo /tmp/hmh-backend.zip -d /tmp/hmh-backend
rm -f /tmp/hmh-backend.zip

# Preserve server-side .env and uploads
if [ -f "$REMOTE_BACKEND_DIR/.env" ]; then
  cp "$REMOTE_BACKEND_DIR/.env" /tmp/hmh-backend/.env
fi
mkdir -p /tmp/hmh-backend/uploads
if [ -d "$REMOTE_BACKEND_DIR/uploads" ]; then
  rsync -a "$REMOTE_BACKEND_DIR/uploads/" /tmp/hmh-backend/uploads/
fi

# Install deps and restart service
pushd /tmp/hmh-backend >/dev/null
npm ci --omit=dev
popd >/dev/null

# Swap into place
rsync -a --delete /tmp/hmh-backend/ "$REMOTE_BACKEND_DIR"/
rm -rf /tmp/hmh-backend

# Restart app (pm2 preferred, fallback to systemd)
if command -v pm2 >/dev/null 2>&1; then
  pm2 start "$REMOTE_BACKEND_DIR/index.js" --name hmh-global || pm2 restart hmh-global
  pm2 save || true
else
  if systemctl is-enabled --quiet hmh-global.service 2>/dev/null; then
    sudo systemctl restart hmh-global.service
  else
    echo "WARNING: Neither pm2 nor systemd service found. Backend may not be running."
  fi
fi

# Set permissions for uploads
mkdir -p "$REMOTE_BACKEND_DIR/uploads"
sudo chown -R "$USER":"$USER" "$REMOTE_BACKEND_DIR/uploads"
find "$REMOTE_BACKEND_DIR/uploads" -type d -exec chmod 775 {} +

# Nginx cache purge hint (optional)
if [ -d /var/cache/nginx ]; then
  sudo find /var/cache/nginx -type f -delete || true
  sudo systemctl reload nginx || true
fi

echo "Deployment finished successfully."
REMOTE_EOF

info "Done." 
