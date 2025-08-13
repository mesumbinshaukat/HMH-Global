#!/usr/bin/env bash
set -euo pipefail

# HMH Global end-to-end deploy script with preflight tests and safe atomic swap
# Usage:
#   SSH_USER=root SSH_HOST=138.68.184.23 SSH_PORT=22 SSH_KEY="$HOME/.ssh/id_rsa" \
#   ./scripts/hmh_deploy.sh

# Config
SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}
REMOTE_FRONTEND_DIR=${REMOTE_FRONTEND_DIR:-/var/www/hmh-global-frontend}
BACKEND_ONLY=${BACKEND_ONLY:-0}

FRONTEND_DIR="Frontend/hmh-global-frontend"
BACKEND_DIR="Backend"

# Helpers
info() { echo -e "\033[1;36m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; }

require() {
  local name="$1"; local val="${!name:-}"; if [[ -z "$val" ]]; then err "Missing required env: $name"; exit 1; fi
}

require SSH_USER
require SSH_HOST

# Local preflight: build artifacts
TMP_DIR=$(mktemp -d)
FRONT_ZIP="$TMP_DIR/hmh-frontend.zip"
BACK_ZIP="$TMP_DIR/hmh-backend.zip"

if [ "$BACKEND_ONLY" != "1" ]; then
  info "Installing frontend deps (with legacy peer deps) and building..."
  pushd "$FRONTEND_DIR" >/dev/null
  npm install --legacy-peer-deps
  npm run build
  popd >/dev/null

  info "Packaging frontend build..."
  (
    cd "$FRONTEND_DIR" && rm -f "$FRONT_ZIP" && zip -qr "$FRONT_ZIP" build
  )
else
  warn "BACKEND_ONLY=1 set; skipping frontend build and package."
fi

info "Packaging backend (excluding node_modules, .env, uploads)..."
(
  cd "$BACKEND_DIR" && rm -f "$BACK_ZIP" && zip -qr "$BACK_ZIP" . \
    -x "node_modules/*" -x ".git/*" -x "uploads/*" -x "*.log" -x ".env*"
)

############################################
# Generate remote script and run it safely #
############################################

# Create remote script locally
REMOTE_SCRIPT="$TMP_DIR/hmh_remote_deploy.sh"
cat > "$REMOTE_SCRIPT" <<'REMOTE_SH'
#!/usr/bin/env bash
set -euo pipefail

REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}
REMOTE_FRONTEND_DIR=${REMOTE_FRONTEND_DIR:-/var/www/hmh-global-frontend}

echo "[REMOTE] Preflight checks..."
for cmd in node npm unzip rsync bash; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[REMOTE][ERROR] Required command missing: $cmd" >&2
    exit 1
  fi
done
if command -v nginx >/dev/null 2>&1; then nginx -t || true; fi

ls -la "$REMOTE_BACKEND_DIR" || true
ls -la "$REMOTE_FRONTEND_DIR" || true

# .env verification (no secrets printed)
if [ -f "$REMOTE_BACKEND_DIR/.env" ]; then
  echo "[REMOTE] .env present"
  if grep -E '^(MONGO_URI|MONGODB_URI)=' "$REMOTE_BACKEND_DIR/.env" >/dev/null 2>&1; then
    uri=$(grep -E '^(MONGO_URI|MONGODB_URI)=' "$REMOTE_BACKEND_DIR/.env" | head -n1 | cut -d'=' -f2-)
    if echo "$uri" | grep -qi 'mongodb.net'; then
      echo "[REMOTE] Mongo points to Atlas (mongodb.net)"
    else
      echo "[REMOTE][WARN] Mongo does not look like Atlas"
    fi
  else
    echo "[REMOTE][WARN] No MONGO_URI in .env"
  fi
else
  echo "[REMOTE][WARN] $REMOTE_BACKEND_DIR/.env missing"
fi

echo "[REMOTE] Begin deployment..."
sudo mkdir -p "$REMOTE_FRONTEND_DIR" "$REMOTE_BACKEND_DIR"
sudo chown -R "$USER":"$USER" "$REMOTE_BACKEND_DIR" "$REMOTE_FRONTEND_DIR"

# Backups
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p /tmp/hmh-backups
if [ -d "$REMOTE_FRONTEND_DIR" ]; then tar -C "$REMOTE_FRONTEND_DIR/.." -czf "/tmp/hmh-backups/frontend-$TS.tgz" "$(basename "$REMOTE_FRONTEND_DIR")" || true; fi
if [ -d "$REMOTE_BACKEND_DIR" ]; then tar -C "$REMOTE_BACKEND_DIR/.." -czf "/tmp/hmh-backups/backend-$TS.tgz" "$(basename "$REMOTE_BACKEND_DIR")" || true; fi

# Frontend (optional)
if [ -f /tmp/hmh-frontend.zip ]; then
  rm -rf "$REMOTE_FRONTEND_DIR"/*
  unzip -qo /tmp/hmh-frontend.zip -d /tmp/hmh-frontend
  rsync -a --delete /tmp/hmh-frontend/build/ "$REMOTE_FRONTEND_DIR"/
  rm -rf /tmp/hmh-frontend /tmp/hmh-frontend.zip
fi

# Backend (preserve .env and uploads)
mkdir -p /tmp/hmh-backend
unzip -qo /tmp/hmh-backend.zip -d /tmp/hmh-backend
rm -f /tmp/hmh-backend.zip
if [ -f "$REMOTE_BACKEND_DIR/.env" ]; then cp "$REMOTE_BACKEND_DIR/.env" /tmp/hmh-backend/.env; fi
mkdir -p /tmp/hmh-backend/uploads
if [ -d "$REMOTE_BACKEND_DIR/uploads" ]; then rsync -a "$REMOTE_BACKEND_DIR/uploads/" /tmp/hmh-backend/uploads/; fi

pushd /tmp/hmh-backend >/dev/null
npm ci --omit=dev
popd >/dev/null

rsync -a --delete /tmp/hmh-backend/ "$REMOTE_BACKEND_DIR"/
rm -rf /tmp/hmh-backend

# Restart backend
if command -v pm2 >/dev/null 2>&1; then
  echo "[REMOTE] Verifying health route in index.js ..."
  if ! grep -q "api/health" "$REMOTE_BACKEND_DIR/index.js"; then
    echo "[REMOTE][WARN] /api/health route not detected in index.js (continuing)"
  fi
  echo "[REMOTE] Forcing clean PM2 start ..."
  pm2 delete hmh-global || true
  PORT=${PORT:-5000} NODE_ENV=production pm2 start "$REMOTE_BACKEND_DIR/index.js" --name hmh-global --update-env --cwd "$REMOTE_BACKEND_DIR"
  pm2 save || true
  pm2 describe hmh-global | sed -n '1,200p' || true
else
  if systemctl is-enabled --quiet hmh-global.service 2>/dev/null; then
    sudo systemctl restart hmh-global.service
  else
    echo "[REMOTE][WARN] Neither pm2 nor systemd unit found; backend may not be running"
  fi
fi

# Permissions
mkdir -p "$REMOTE_BACKEND_DIR/uploads"
sudo chown -R "$USER":"$USER" "$REMOTE_BACKEND_DIR/uploads"
find "$REMOTE_BACKEND_DIR/uploads" -type d -exec chmod 775 {} +

# Nginx cache purge (best-effort)
if command -v nginx >/dev/null 2>&1; then
  if [ -d /var/cache/nginx ]; then sudo find /var/cache/nginx -type f -delete || true; fi
  sudo systemctl reload nginx || true
fi

# Health checks
set +e
BE_HEALTH=$(curl -fsS http://localhost:5000/api/health || curl -fsS http://localhost/api/health || true)
BE_HEALTH_FALLBACK=$(curl -fsS http://localhost:5000/health || curl -fsS http://localhost/health || true)
FE_INDEX_HEAD=$(curl -fsS http://localhost/ | head -n 5)
SUGGEST_SAMPLE=$(curl -fsS "http://localhost/api/products/suggest?q=vit" | head -c 500 || curl -fsS "http://localhost:5000/api/products/suggest?q=vit" | head -c 500)
set -e

echo "--- BACKEND HEALTH ---"
echo "$BE_HEALTH"
echo "--- BACKEND HEALTH (fallback) ---"
echo "$BE_HEALTH_FALLBACK"
echo "--- FRONT PAGE HEAD ---"
echo "$FE_INDEX_HEAD"
echo "--- SUGGEST SAMPLE (truncated) ---"
echo "$SUGGEST_SAMPLE"

echo "[REMOTE] Deployment finished."
REMOTE_SH

chmod +x "$REMOTE_SCRIPT"

# Build SSH/SCP options (omit -i if no key provided or file not found)
SSH_OPTS=(-p "$SSH_PORT")
SCP_OPTS=(-P "$SSH_PORT")
if [[ -n "${SSH_KEY}" && -f "${SSH_KEY}" ]]; then
  SSH_OPTS=(-i "$SSH_KEY" -p "$SSH_PORT")
  SCP_OPTS=(-i "$SSH_KEY" -P "$SSH_PORT")
else
  info "SSH key not provided or not found; forcing password authentication."
  SSH_OPTS=(-p "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
  SCP_OPTS=(-P "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
fi

# Upload artifacts
info "Uploading artifacts and remote script..."
if [ "$BACKEND_ONLY" != "1" ] && [ -f "$FRONT_ZIP" ]; then
  scp "${SCP_OPTS[@]}" "$FRONT_ZIP" "$SSH_USER@$SSH_HOST:/tmp/hmh-frontend.zip"
fi
scp "${SCP_OPTS[@]}" "$BACK_ZIP"  "$SSH_USER@$SSH_HOST:/tmp/hmh-backend.zip"
scp "${SCP_OPTS[@]}" "$REMOTE_SCRIPT" "$SSH_USER@$SSH_HOST:/tmp/hmh_remote_deploy.sh"

# Remote deploy with atomic swap and health checks
info "Deploying on server..."
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR REMOTE_FRONTEND_DIR=$REMOTE_FRONTEND_DIR bash /tmp/hmh_remote_deploy.sh'"

info "Cleaning local temp artifacts..."
rm -rf "$TMP_DIR" || true

info "All done."
