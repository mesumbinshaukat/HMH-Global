#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d_%H%M%S)
OUT="/root/hmh_audit_$TS.log"
{
echo "=== AUDIT START $TS ==="

echo
echo "=== SYSTEM ==="
uname -a
if command -v lsb_release >/dev/null 2>&1; then lsb_release -a || true; else cat /etc/os-release; fi
whoami

echo
echo "=== DISK & MEMORY ==="
df -h
free -h

echo
echo "=== NETWORK PORTS (80/443/3000) ==="
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | egrep -E ':(80|443|3000)\b' || true

echo
echo "=== UFW FIREWALL ==="
(ufw status 2>/dev/null || echo "ufw not installed")

echo
echo "=== NGINX STATUS ==="
(systemctl status nginx --no-pager || service nginx status || true)

echo
echo "=== NGINX CONFIG (first 200 lines) ==="
(nginx -T 2>/dev/null | sed -n '1,200p' || true)

echo
echo "=== /var/www LISTING ==="
ls -la /var/www

echo
echo "=== /var/www/hmh-global (backend root) ==="
ls -la /var/www/hmh-global
du -h -d1 /var/www/hmh-global 2>/dev/null || true

echo
echo "=== /var/www/hmh-global/public (frontend build) ==="
ls -la /var/www/hmh-global/public
du -h -d1 /var/www/hmh-global/public 2>/dev/null || true

echo
echo "=== BACKEND KEY FILES ==="
ls -la /var/www/hmh-global | egrep -i '(env$|env\\.|ecosystem|pm2|package.json|package-lock.json|yarn.lock|tsconfig|README|server|app\\.js|index\\.js)$' || true

echo
echo "=== ENV FILE NAMES & VAR KEYS (no values) ==="
for f in /var/www/hmh-global/.env*; do
  [ -f "$f" ] && echo "-- $f --" && awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}' "$f" | sort -u
done

echo
echo "=== NODE/NPM/PM2 ==="
(node -v || which node || true)
(npm -v || true)
(pm2 -v && pm2 list || true)

echo
echo "=== PM2 DETAILS (if any) ==="
(pm2 jlist 2>/dev/null | head -c 4000 || true)

echo
echo "=== GIT STATUS (if repo) ==="
(cd /var/www/hmh-global && git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git remote -v && git branch --show-current && git log -n 3 --oneline || echo "Not a git repo")

echo
echo "=== NGINX LOGS (tail) ==="
(tail -n 200 /var/log/nginx/access.log 2>/dev/null || true)
(tail -n 200 /var/log/nginx/error.log 2>/dev/null || true)

echo "=== AUDIT END $TS ==="
} | tee "$OUT"

echo
echo "Saved report to $OUT"