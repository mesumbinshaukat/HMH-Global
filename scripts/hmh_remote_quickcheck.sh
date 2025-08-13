#!/usr/bin/env bash
set -euo pipefail

# Quick remote checks: index.js health route, PM2 status, port 5000, curl checks
# Usage: SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] ./scripts/hmh_remote_quickcheck.sh

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
cd "$BACKEND_DIR" || true

echo '=== PWD ==='
pwd || true

echo '=== .env (redacted) ==='
if [ -f .env ]; then sed -E 's/^([^=]+)=.*/\1=***REDACTED***/' .env | sed -n '1,60p'; else echo 'no .env'; fi

echo '=== index.js (head 140) ==='
sed -n '1,140p' index.js 2>/dev/null || echo 'index.js not readable'

echo '=== grep api/health in index.js ==='
grep -n "api/health" index.js 2>/dev/null || echo 'no api/health found'

echo '=== PM2 LIST ==='
pm2 list || true

echo '=== PM2 SHOW hmh-global (first 120 lines) ==='
pm2 info hmh-global | sed -n '1,120p' || true

echo '=== LISTENERS on :5000 ==='
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | grep ':5000' || echo 'no listeners found'

echo '=== CURL 127.0.0.1:5000/ ==='
(curl -sS -i http://127.0.0.1:5000/ || true) | head -n 20

echo '=== CURL 127.0.0.1:5000/api/health ==='
(curl -sS -i http://127.0.0.1:5000/api/health || true) | head -n 40
RCMDS

ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR bash -s'" <<< "$REMOTE_CMDS"
