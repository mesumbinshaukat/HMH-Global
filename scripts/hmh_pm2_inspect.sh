#!/usr/bin/env bash
set -euo pipefail

# Inspect PM2 app, process listening on 5000, and verify running script path
# Usage: SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] ./scripts/hmh_pm2_inspect.sh

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

echo '=== PM2 DESCRIBE hmh-global ==='
pm2 describe hmh-global || pm2 info hmh-global || true

echo '=== PM2 LIST (raw jlist first 200 chars) ==='
(pm2 jlist | head -c 200 || true); echo

echo '=== WHO LISTENS ON :5000 ==='
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | grep ':5000' || echo 'none'

# Try to map PID to script path
PID=$( (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | awk '/:5000/ {print $NF}' | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n1 )
echo "Detected PID: ${PID:-none}"
if [[ -n "${PID:-}" ]]; then
  echo '=== PROC CMDLINE ==='
  tr -d '\0' < /proc/$PID/cmdline | sed 's/ -/\n-/g' || true
  echo '=== PROC CWD ==='
  readlink -f /proc/$PID/cwd || true
  echo '=== PROC EXE ==='
  readlink -f /proc/$PID/exe || true
  echo '=== OPEN FILES (node script) ==='
  ls -l /proc/$PID/fd 2>/dev/null | head -n 40 || true
fi

echo '=== BACKEND index.js HEAD (1..140) ==='
sed -n '1,140p' "$BACKEND_DIR/index.js" 2>/dev/null || echo 'index.js not readable'

echo '=== CURL DIRECT 5000 / and /api/health and /health ==='
(curl -sS -i http://127.0.0.1:5000/ || true) | head -n 10
(curl -sS -i http://127.0.0.1:5000/api/health || true) | head -n 20
(curl -sS -i http://127.0.0.1:5000/health || true) | head -n 20
RCMDS

ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_BACKEND_DIR=$REMOTE_BACKEND_DIR bash -s'" <<< "$REMOTE_CMDS"
