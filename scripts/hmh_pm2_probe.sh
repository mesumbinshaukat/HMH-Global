#!/usr/bin/env bash
set -euo pipefail

# Probe PM2 + backend app, save results to /tmp on server, then copy to scripts/pm2_probe.log
# Usage: SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] ./scripts/hmh_pm2_probe.sh

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}

[[ -z "${SSH_USER}" || -z "${SSH_HOST}" ]] && { echo "Missing SSH_USER/SSH_HOST" >&2; exit 1; }

SSH_OPTS=(-p "$SSH_PORT")
SCP_OPTS=(-P "$SSH_PORT")
if [[ -n "$SSH_KEY" && -f "$SSH_KEY" ]]; then
  SSH_OPTS=(-i "$SSH_KEY" -p "$SSH_PORT")
  SCP_OPTS=(-i "$SSH_KEY" -P "$SSH_PORT")
else
  SSH_OPTS=(-p "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
  SCP_OPTS=(-P "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
fi

read -r -d '' REMOTE_CMDS <<'RCMDS'
set -e
BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}
OUT="/tmp/pm2_probe_$(date +%Y%m%d-%H%M%S).log"
{
  echo '=== PWD ==='
  pwd || true
  echo '=== .env KEYS ==='
  if [ -f "$BACKEND_DIR/.env" ]; then cut -d= -f1 "$BACKEND_DIR/.env" | sed -n '1,80p'; else echo 'no .env'; fi
  echo '=== index.js HEAD (1..160) ==='
  sed -n '1,160p' "$BACKEND_DIR/index.js" 2>/dev/null || echo 'index.js not readable'
  echo '=== GREP HEALTH ROUTES ==='
  grep -n "api/health" "$BACKEND_DIR/index.js" 2>/dev/null || echo 'no /api/health'
  grep -n "app.get('/health'" "$BACKEND_DIR/index.js" 2>/dev/null || echo 'no /health'
  echo '=== PM2 DESCRIBE hmh-global ==='
  pm2 describe hmh-global || pm2 info hmh-global || true
  echo '=== LISTENERS ON :5000 ==='
  (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | grep ':5000' || echo 'none'
  echo '=== CURL 5000 / ==='
  (curl -sS -i http://127.0.0.1:5000/ || true) | head -n 20
  echo '=== CURL 5000 /api/health ==='
  (curl -sS -i http://127.0.0.1:5000/api/health || true) | head -n 40
  echo '=== CURL 5000 /health ==='
  (curl -sS -i http://127.0.0.1:5000/health || true) | head -n 40
} > "$OUT" 2>&1

echo "$OUT"
RCMDS

REMOTE_OUT_PATH=$(ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR bash -s'" <<< "$REMOTE_CMDS")
LOCAL_OUT="$(pwd | sed 's/\\\\/\//g')/scripts/pm2_probe.log"
scp "${SCP_OPTS[@]}" "$SSH_USER@$SSH_HOST:$REMOTE_OUT_PATH" "$LOCAL_OUT"
echo "[INFO] PM2 probe saved to $LOCAL_OUT"
