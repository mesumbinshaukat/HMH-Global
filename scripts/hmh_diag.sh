#!/usr/bin/env bash
set -euo pipefail

# Read-only diagnostics on VPS to avoid quoting pitfalls
# Usage:
#   SSH_USER=root SSH_HOST=138.68.184.23 SSH_PORT=22 SSH_KEY="" ./scripts/hmh_diag.sh

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_ROOT=${REMOTE_ROOT:-/var/www/hmh-global}

if [[ -z "${SSH_USER}" || -z "${SSH_HOST}" ]]; then
  echo "[ERROR] SSH_USER and SSH_HOST are required" >&2
  exit 1
fi

TMP_DIR=$(mktemp -d)
REMOTE_SCRIPT="$TMP_DIR/hmh_remote_diag.sh"

cat > "$REMOTE_SCRIPT" <<'REMOTE_DIAG'
#!/usr/bin/env bash
set -euo pipefail

REMOTE_LOG="/tmp/hmh_diag_$(date +%Y%m%d-%H%M%S).log"

REMOTE_ROOT=${REMOTE_ROOT:-/var/www/hmh-global}
REMOTE_FRONTEND_DIR="$REMOTE_ROOT/public"
REMOTE_BACKEND_DIR="$REMOTE_ROOT"

{
echo "==== VERSIONS ===="
(node -v || true) && (npm -v || true)

echo "==== PM2 LIST ===="
if command -v pm2 >/dev/null 2>&1; then pm2 list || true; else echo "pm2 not installed"; fi

echo "==== PM2 INFO hmh-global ===="
if command -v pm2 >/dev/null 2>&1; then pm2 info hmh-global || true; fi

echo "==== NGINX TEST ===="
if command -v nginx >/dev/null 2>&1; then nginx -t || true; else echo "nginx not installed"; fi

echo "==== NGINX SITES ENABLED ===="
ls -la /etc/nginx/sites-enabled/ || true

echo "==== GREP HMH IN NGINX CONFIGS ===="
grep -Rni 'hmh' /etc/nginx/sites-available/ /etc/nginx/sites-enabled/ || true

echo "==== NGINX SITE CONFIG CONTENT (enabled) ===="
for f in /etc/nginx/sites-enabled/*; do
  [ -e "$f" ] || continue
  echo "---- FILE: $f ----"
  realf=$(readlink -f "$f" 2>/dev/null || echo "$f")
  echo "REALPATH: $realf"
  echo "-- HEAD (1..200) --"
  sed -n '1,200p' "$realf" 2>/dev/null || true
  echo "-- ROOT/ALIAS/TRY_FILES LINES --"
  grep -nE '\\b(root|alias|try_files)\\b' "$realf" 2>/dev/null || true
done

echo "==== BACKEND .ENV (redacted) ===="
if [ -f "$REMOTE_BACKEND_DIR/.env" ]; then
  sed -E 's/^([^=]+)=.*/\1=***REDACTED***/' "$REMOTE_BACKEND_DIR/.env" | sed -n '1,200p'
else
  echo "$REMOTE_BACKEND_DIR/.env MISSING"
fi

echo "==== BACKEND DIR LIST ===="
ls -la "$REMOTE_BACKEND_DIR" || true
echo "==== BACKEND index.js (head 200) ===="
sed -n '1,200p' "$REMOTE_BACKEND_DIR/index.js" 2>/dev/null || echo "index.js not readable"
echo "==== BACKEND index.js (grep api/health) ===="
grep -n "api/health" "$REMOTE_BACKEND_DIR/index.js" 2>/dev/null || echo "no api/health found"
echo "==== BACKEND routes dir ===="
ls -la "$REMOTE_BACKEND_DIR/routes" 2>/dev/null || echo "no routes dir"
echo "==== FRONTEND DIR LIST ===="
ls -la "$REMOTE_FRONTEND_DIR" || true

echo "==== FRONTEND CANDIDATE PATHS (mtimes) ===="
for d in \
  /var/www/hmh-global-frontend \
  /var/www/hmh-global/public \
  /var/www/html \
  /usr/share/nginx/html \
  /var/www/hmh-global-frontend/build; do
  if [ -d "$d" ]; then
    echo "-- $d --"
    ls -lat "$d" | head -n 20
    if [ -f "$d/index.html" ]; then echo "index.html -> $(stat -c '%y' "$d/index.html" 2>/dev/null || echo n/a)"; fi
  fi
done

echo "==== LISTENING PORTS (node/nginx) ===="
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | sed -n '1,200p'

echo "==== CURL FRONT (localhost) ===="
curl -i http://localhost/ || true

echo "==== CURL HEALTH ===="
(curl -i http://localhost/api/health || curl -i http://localhost:5000/api/health || true)

echo "==== CURL HEALTH (public) ===="
(curl -i http://127.0.0.1/api/health || true)
(curl -i http://localhost:80/api/health || true)

echo "==== CURL SUGGEST (truncated) ===="
(curl -i "http://localhost/api/products/suggest?q=vit" | sed -n '1,60p' || true)
(curl -i "http://localhost:5000/api/products/suggest?q=vit" | sed -n '1,60p' || true)

echo "==== PM2 LOGS (last 80) ===="
if command -v pm2 >/dev/null 2>&1; then pm2 logs hmh-global --lines 80 --nostream || true; fi
echo "==== PM2 SHOW APP PATH ===="
if command -v pm2 >/dev/null 2>&1; then pm2 info hmh-global | sed -n '1,200p' || true; fi
echo "==== LISTENERS ON :5000 ===="
ss -ltnp 2>/dev/null | grep ':5000' || netstat -ltnp 2>/dev/null | grep ':5000' || echo "no listeners info"
echo "==== NODE PROCESSES ===="
ps aux | grep -i node | grep -v grep | sed -n '1,200p' || true

echo "==== NGINX ERROR LOG (last 200) ===="
tail -n 200 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error.log or insufficient permissions"

} > "$REMOTE_LOG" 2>&1
echo "$REMOTE_LOG"
REMOTE_DIAG

chmod +x "$REMOTE_SCRIPT"

SSH_OPTS=(-p "$SSH_PORT")
SCP_OPTS=(-P "$SSH_PORT")
if [[ -n "${SSH_KEY}" && -f "${SSH_KEY}" ]]; then
  SSH_OPTS=(-i "$SSH_KEY" -p "$SSH_PORT")
  SCP_OPTS=(-i "$SSH_KEY" -P "$SSH_PORT")
else
  echo "[INFO] No SSH key provided; fallback to agent/password."
fi

scp "${SCP_OPTS[@]}" "$REMOTE_SCRIPT" "$SSH_USER@$SSH_HOST:/tmp/hmh_remote_diag.sh"
REMOTE_LOG_PATH=$(ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'REMOTE_ROOT=$REMOTE_ROOT bash /tmp/hmh_remote_diag.sh'" | tail -n 1)

REPO_LOG_FILE="$(pwd | sed 's/\\\\/\//g')/scripts/last_remote_diag.log"
mkdir -p "$(dirname "$REPO_LOG_FILE")"
scp "${SCP_OPTS[@]}" "$SSH_USER@$SSH_HOST:$REMOTE_LOG_PATH" "$REPO_LOG_FILE"
echo "[INFO] Downloaded diagnostics log to: $REPO_LOG_FILE"
echo "================ BEGIN REMOTE DIAGNOSTICS LOG ================"
sed -n '1,2000p' "$REPO_LOG_FILE" || true
echo "================  END REMOTE DIAGNOSTICS LOG  ================"

rm -rf "$TMP_DIR" || true
echo "[INFO] Diagnostics complete."
