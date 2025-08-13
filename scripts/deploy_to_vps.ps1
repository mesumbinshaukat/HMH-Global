param(
  [Parameter(Mandatory=$true)] [string]$SSH_HOST,
  [string]$SSH_USER = "ubuntu",
  [int]$SSH_PORT = 22,
  [string]$APP_NAME = "hmh-backend",
  [string]$REMOTE_BACKEND_DIR = "/var/www/hmh-global",
  [string]$REMOTE_FRONTEND_DIR = "/var/www/hmh-global/public"
)

$ErrorActionPreference = "Stop"

Write-Host "[deploy] Building frontend" -ForegroundColor Cyan
$ROOT = Split-Path -Parent $PSScriptRoot
$FRONTEND = Join-Path $ROOT "Frontend/hmh-global-frontend"
$BACKEND = Join-Path $ROOT "Backend"

Push-Location $FRONTEND
if (Test-Path package-lock.json) { npm ci } else { npm install }
npm run build
Pop-Location

Write-Host "[deploy] Ensuring remote directories exist" -ForegroundColor Cyan
ssh -p $SSH_PORT "$SSH_USER@$SSH_HOST" "sudo mkdir -p '$REMOTE_BACKEND_DIR' '$REMOTE_FRONTEND_DIR' && sudo chown -R \$USER: '$REMOTE_BACKEND_DIR' '$REMOTE_FRONTEND_DIR'"

# Sync frontend build using scp (recursive)
Write-Host "[deploy] Uploading frontend build -> $REMOTE_FRONTEND_DIR" -ForegroundColor Cyan
scp -P $SSH_PORT -r (Join-Path $FRONTEND "build/*") "$SSH_USER@$SSH_HOST:$REMOTE_FRONTEND_DIR/"

# Upload backend (excluding node_modules)
Write-Host "[deploy] Uploading backend -> $REMOTE_BACKEND_DIR" -ForegroundColor Cyan
# Create a temp zip excluding node_modules
$zip = Join-Path $env:TEMP "hmh-backend.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
$exclude = @("node_modules", ".env.local", ".env.development", "*.log")
$items = Get-ChildItem $BACKEND -Force | Where-Object { $exclude -notcontains $_.Name }
Compress-Archive -Path $items.FullName -DestinationPath $zip
scp -P $SSH_PORT $zip "$SSH_USER@$SSH_HOST:/tmp/hmh-backend.zip"
Remove-Item $zip -Force

ssh -p $SSH_PORT "$SSH_USER@$SSH_HOST" "\
  set -e; \
  mkdir -p '$REMOTE_BACKEND_DIR'; \
  unzip -o /tmp/hmh-backend.zip -d '$REMOTE_BACKEND_DIR'; \
  rm -f /tmp/hmh-backend.zip; \
  cd '$REMOTE_BACKEND_DIR'; \
  if command -v npm >/dev/null 2>&1; then npm ci --only=production || npm install --production; else echo 'npm missing' && exit 1; fi; \
  if command -v pm2 >/dev/null 2>&1; then pm2 describe '$APP_NAME' >/dev/null 2>&1 && pm2 reload '$APP_NAME' || pm2 start index.js --name '$APP_NAME'; pm2 save; else sudo systemctl restart hmh-backend.service || true; fi; \
  echo 'Backend deployed.'"

Write-Host "[deploy] Done." -ForegroundColor Green
