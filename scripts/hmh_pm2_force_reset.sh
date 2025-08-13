#!/usr/bin/env bash
set -euo pipefail

# Forcefully reset backend: stop pm2 app, free port 5000, and start clean
# Usage: SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] ./scripts/hmh_pm2_force_reset.sh

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}

[[ -z "${SSH_USER}" || -z "${SSH_HOST}" ]] && { echo "Missing SSH_USER/SSH_HOST" >&2; exit 1; }

SSH_OPTS=(-p "$SSH_PORT")
if [[ -n "$SSH_KEY" && -f "$SSH_KEY" ]]; then
  SSH_OPTS=(-i "$SSH_KEY" -p "$SSH_PORT")
else
  SSH_OPTS=(-p "$SSH_PORT" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
fi

read -r -d '' REMOTE_CMDS <<'RCMDS'
set -e
BACKEND_DIR=${REMOTE_BACKEND_DIR:-/var/www/hmh-global}

echo '=== NODE VERSION ==='
node -v || true

echo '=== STOP PM2 APP ==='
pm2 delete hmh-global || true

echo '=== FREE PORT 5000 ==='
if command -v fuser >/dev/null 2>&1; then fuser -k 5000/tcp || true; fi
if command -v lsof >/dev/null 2>&1; then lsof -ti:5000 | xargs -r kill -9 || true; fi
if command -v ss >/dev/null 2>&1; then ss -ltnp | grep ':5000' || true; fi

cd "$BACKEND_DIR" || exit 1

echo '=== SHOW index.js HEAD (1..120) ==='
sed -n '1,120p' index.js 2>/dev/null || true

echo '=== START PM2 CLEAN ==='
PORT=${PORT:-5000} NODE_ENV=production pm2 start index.js --name hmh-global --update-env --cwd "$BACKEND_DIR"
pm2 save || true
pm2 describe hmh-global | sed -n '1,200p' || true

sleep 2

echo '=== CURL DIRECT 5000 / ==='
(curl -sS -i http://127.0.0.1:5000/ || true) | head -n 20

echo '=== CURL DIRECT 5000 /api/health ==='
(curl -sS -i http://127.0.0.1:5000/api/health || true) | head -n 40

echo '=== CURL DIRECT 5000 /health ==='
(curl -sS -i http://127.0.0.1:5000/health || true) | head -n 40
RCMDS

ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR bash -s'" <<< "$REMOTE_CMDS"
