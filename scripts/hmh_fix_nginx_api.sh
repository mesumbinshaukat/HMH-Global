#!/usr/bin/env bash
set -euo pipefail

# Ensure Nginx proxies /api to backend on the VPS
# Usage:
#   SSH_USER=root SSH_HOST=138.68.184.23 [SSH_PORT=22] [SSH_KEY=~/.ssh/id_rsa] \
#   [API_UPSTREAM=http://127.0.0.1:5000] ./scripts/hmh_fix_nginx_api.sh

SSH_USER=${SSH_USER:-}
SSH_HOST=${SSH_HOST:-}
SSH_PORT=${SSH_PORT:-22}
SSH_KEY=${SSH_KEY:-}
API_UPSTREAM=${API_UPSTREAM:-http://127.0.0.1:5000}

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

# Remote script to: find active site; if /api not present, insert a location block; test and reload
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
RS="$TMP/hmh_fix_nginx.sh"
cat > "$RS" <<'REMOTE_NGX'
#!/usr/bin/env bash
set -euo pipefail

API_UPSTREAM_DEFAULT="http://127.0.0.1:5000"
API_UPSTREAM="${API_UPSTREAM:-$API_UPSTREAM_DEFAULT}"

choose_site() {
  for f in /etc/nginx/sites-enabled/*; do
    [ -e "$f" ] || continue
    if grep -qE "root\s+/(var/)?www/(hmh-global-frontend|hmh-global/public)\b" "$f" 2>/dev/null; then
      echo "$f"; return 0
    fi
  done
  ls -1 /etc/nginx/sites-enabled/* 2>/dev/null | head -n1
}

SITE_FILE=$(choose_site)
if [[ -z "${SITE_FILE:-}" || ! -f "$SITE_FILE" ]]; then
  echo "[REMOTE][ERROR] Could not locate nginx site file" >&2
  exit 1
fi

if grep -q "location /api" "$SITE_FILE"; then
  echo "[REMOTE] /api location already present in: $SITE_FILE"
else
  echo "[REMOTE] Inserting /api proxy into: $SITE_FILE"
  BKP="$SITE_FILE.bak.$(date +%Y%m%d-%H%M%S)"
  cp "$SITE_FILE" "$BKP"
  awk -v up="$API_UPSTREAM" '
    BEGIN { depth=0; last_close=0 }
    {
      line=$0
      if (line ~ /server[[:space:]]*{/) depth++
      buf[NR]=line; lines=NR
      if (line ~ /^}/) {
        if (depth==1) last_close=NR
        if (depth>0) depth--
      }
    }
    END {
      insert_at = (last_close>0) ? last_close : lines
      for (i=1;i<=lines;i++) {
        if (i==insert_at) {
          print "    location /api {"
          print "        proxy_pass " up ";"
          print "        proxy_http_version 1.1;"
          print "        proxy_set_header Upgrade $http_upgrade;"
          print "        proxy_set_header Connection \"upgrade\";"
          print "        proxy_set_header Host $host;"
          print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
          print "        proxy_set_header X-Forwarded-Proto $scheme;"
          print "    }"
        }
        print buf[i]
      }
    }
  ' "$BKP" > "$SITE_FILE.tmp"
  mv "$SITE_FILE.tmp" "$SITE_FILE"
fi

nginx -t
systemctl reload nginx || service nginx reload || true

echo "[REMOTE] Post-reload health:"
(curl -sS -i http://127.0.0.1/api/health || true) | head -n 40
REMOTE_NGX
chmod +x "$RS"

info "Uploading and running Nginx /api fix script on server..."
scp "${SCP_OPTS[@]}" "$RS" "$SSH_USER@$SSH_HOST:/tmp/hmh_fix_nginx.sh"
ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "bash -lc 'API_UPSTREAM=$API_UPSTREAM bash /tmp/hmh_fix_nginx.sh'"

info "Done."
