#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   SSH_USER=root SSH_HOST=138.68.184.23 ./scripts/hmh_verify_frontend.sh
# Optional env:
#   SSH_PORT=22
#   SSH_KEY=~/.ssh/id_rsa
#   REMOTE_SITE_NAME=hmh-global
#   DESIRED_FRONTEND_DIR=/var/www/hmh-global-frontend
#   APPLY=1   # to apply fix (update Nginx root to DESIRED_FRONTEND_DIR and reload)

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
REMOTE_SITE_NAME=${REMOTE_SITE_NAME:-hmh-global}
DESIRED_FRONTEND_DIR=${DESIRED_FRONTEND_DIR:-/var/www/hmh-global-frontend}
APPLY=${APPLY:-0}

if [[ -z "$SSH_USER" || -z "$SSH_HOST" ]]; then
  echo "[ERROR] SSH_USER and SSH_HOST are required" >&2
  exit 1
fi

TMP_DIR=$(mktemp -d)
REMOTE_SCRIPT="$TMP_DIR/verify_frontend_remote.sh"

cat > "$REMOTE_SCRIPT" <<'REMOTE_SH'
#!/usr/bin/env bash
set -euo pipefail

SITE_NAME=${SITE_NAME:-hmh-global}
DESIRED_DIR=${DESIRED_DIR:-/var/www/hmh-global-frontend}
APPLY=${APPLY:-0}

conf_symlink="/etc/nginx/sites-enabled/$SITE_NAME"
if [ ! -e "$conf_symlink" ]; then
  echo "[ERROR] Nginx site not found: $conf_symlink" >&2
  exit 2
fi
conf_path="$conf_symlink"
if command -v readlink >/dev/null 2>&1; then
  realp=$(readlink -f "$conf_symlink" 2>/dev/null || true)
  if [ -n "$realp" ]; then conf_path="$realp"; fi
fi

echo "[INFO] Using config: $conf_path"

# Extract root and try_files lines
cur_root=$(grep -nE "^[[:space:]]*root[[:space:]]+" "$conf_path" 2>/dev/null || true)
try_lines=$(grep -nE "try_files" "$conf_path" 2>/dev/null || true)

echo "[INFO] Current root line(s):"
echo "$cur_root"
echo "[INFO] try_files lines:"
echo "$try_lines"

# Show candidate frontend directories and index.html mtime
for d in \
  /var/www/hmh-global-frontend \
  /var/www/hmh-global/public \
  /var/www/html \
  /usr/share/nginx/html; do
  if [ -d "$d" ]; then
    echo "-- $d --"
    ls -lat "$d" | head -n 15 || true
    [ -f "$d/index.html" ] && { echo -n "index.html mtime: "; stat -c '%y' "$d/index.html" 2>/dev/null || true; }
  fi
done

if [ "$APPLY" = "1" ]; then
  echo "[INFO] Applying root update to $DESIRED_DIR..."
  if [ ! -d "$DESIRED_DIR" ]; then
    echo "[ERROR] Desired directory does not exist: $DESIRED_DIR" >&2
    exit 3
  fi
  ts=$(date +%Y%m%d-%H%M%S)
  backup="/etc/nginx/sites-available/${SITE_NAME}.$ts.bak"
  if [ -w "$conf_path" ]; then
    cp "$conf_path" "$backup"
  else
    sudo cp "$conf_path" "$backup"
  fi
  echo "[INFO] Backup saved: $backup"

  # Replace root directive to point to DESIRED_DIR (only the first matching root in server block)
  # Simple sed replacement: root <anything>; -> root DESIRED_DIR;
  if sed -n '1,200p' "$conf_path" | grep -qE "^[[:space:]]*root[[:space:]]+"; then
    if [ -w "$conf_path" ]; then
      sed -i -E "s#(^[[:space:]]*root[[:space:]]+).*;#\\1${DESIRED_DIR};#" "$conf_path"
    else
      sudo sed -i -E "s#(^[[:space:]]*root[[:space:]]+).*;#\\1${DESIRED_DIR};#" "$conf_path"
    fi
  else
    echo "[WARN] No root directive found to replace; leaving as-is"
  fi

  echo "[INFO] Testing Nginx config..."
  if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t
    echo "[INFO] Reloading Nginx..."
    if command -v systemctl >/dev/null 2>&1; then
      sudo systemctl reload nginx || sudo systemctl restart nginx
    else
      sudo service nginx reload || sudo service nginx restart
    fi
  else
    echo "[WARN] nginx not installed? skipping test/reload"
  fi

  echo "[INFO] Done applying root change. New root lines:"
  grep -nE "^[[:space:]]*root[[:space:]]+" "$conf_path" || true
fi
REMOTE_SH

chmod +x "$REMOTE_SCRIPT"

SSH_OPTS=(-p "$SSH_PORT")
SCP_OPTS=(-P "$SSH_PORT")
if [[ -n "$SSH_KEY" && -f "$SSH_KEY" ]]; then
  SSH_OPTS+=( -i "$SSH_KEY" )
  SCP_OPTS+=( -i "$SSH_KEY" )
else
  SSH_OPTS+=( -o PreferredAuthentications=password -o PubkeyAuthentication=no )
  SCP_OPTS+=( -o PreferredAuthentications=password -o PubkeyAuthentication=no )
fi

# Upload and execute remotely
scp "${SCP_OPTS[@]}" "$REMOTE_SCRIPT" "$SSH_USER@$SSH_HOST:/tmp/verify_frontend_remote.sh"
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'SITE_NAME=$REMOTE_SITE_NAME DESIRED_DIR=$DESIRED_FRONTEND_DIR APPLY=$APPLY bash /tmp/verify_frontend_remote.sh'"

rm -rf "$TMP_DIR" || true
