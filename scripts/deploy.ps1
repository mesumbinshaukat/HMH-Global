param(
  [Parameter(Mandatory=$true)] [string]$SshUser,
  [Parameter(Mandatory=$true)] [string]$SshHost,
  [int]$SshPort = 22,
  [string]$SshKeyPath = "$HOME/.ssh/id_rsa",
  [string]$RemoteRoot = "/var/www/hmh-global"
)

$ErrorActionPreference = 'Stop'

function Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Paths
$FrontendDir = "Frontend/hmh-global-frontend"
$BackendDir  = "Backend"
$FrontendZip = "$env:TEMP/hmh-frontend.zip"
$BackendZip  = "$env:TEMP/hmh-backend.zip"

# Ensure OpenSSH tools exist
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { Err "ssh not found in PATH"; exit 1 }
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) { Err "scp not found in PATH"; exit 1 }

# Build frontend
Info "Installing and building frontend..."
Push-Location $FrontendDir
npm ci
npm run build
Pop-Location

# Create artifacts
Info "Creating artifacts..."
if (Test-Path $FrontendZip) { Remove-Item $FrontendZip -Force }
if (Test-Path $BackendZip) { Remove-Item $BackendZip -Force }

Compress-Archive -Path "$FrontendDir/build/*" -DestinationPath $FrontendZip -Force

# Exclude large/unnecessary backend paths
$exclude = @('node_modules','uploads','.git','.env','.env.production','.env.development','*.log')
$files = Get-ChildItem $BackendDir -Recurse | Where-Object {
  foreach ($ex in $exclude) { if ($_ .FullName -like "*${ex}") { return $false } }
  return $true
}
Compress-Archive -Path $files.FullName -DestinationPath $BackendZip -Force

# Upload artifacts
Info "Uploading artifacts to $SshUser@$SshHost:$RemoteRoot ..."
scp -i $SshKeyPath -P $SshPort $FrontendZip "$SshUser@$SshHost:/tmp/hmh-frontend.zip"
scp -i $SshKeyPath -P $SshPort $BackendZip  "$SshUser@$SshHost:/tmp/hmh-backend.zip"

# Remote deploy commands
$remoteCmd = @"
set -euo pipefail
REMOTE_ROOT=${RemoteRoot}
REMOTE_FRONTEND_DIR="[24h[?25h$RemoteRoot/public"
REMOTE_BACKEND_DIR="[24h[?25h$RemoteRoot"

sudo mkdir -p "$RemoteRoot/public" "$RemoteRoot"
sudo chown -R "$USER":"$USER" "$RemoteRoot"

# Frontend
rm -rf "$RemoteRoot/public"/*
unzip -qo /tmp/hmh-frontend.zip -d /tmp/hmh-frontend
rsync -a --delete /tmp/hmh-frontend/build/ "$RemoteRoot/public"/
rm -rf /tmp/hmh-frontend /tmp/hmh-frontend.zip

# Backend
mkdir -p /tmp/hmh-backend
unzip -qo /tmp/hmh-backend.zip -d /tmp/hmh-backend
rm -f /tmp/hmh-backend.zip

# Preserve .env and uploads
if [ -f "$RemoteRoot/.env" ]; then cp "$RemoteRoot/.env" /tmp/hmh-backend/.env; fi
mkdir -p /tmp/hmh-backend/uploads
if [ -d "$RemoteRoot/uploads" ]; then rsync -a "$RemoteRoot/uploads/" /tmp/hmh-backend/uploads/; fi

pushd /tmp/hmh-backend >/dev/null
npm ci --omit=dev
popd >/dev/null

rsync -a --delete /tmp/hmh-backend/ "$RemoteRoot"/
rm -rf /tmp/hmh-backend

if command -v pm2 >/dev/null 2>&1; then
  pm2 start "$RemoteRoot/index.js" --name hmh-global || pm2 restart hmh-global
  pm2 save || true
else
  if systemctl is-enabled --quiet hmh-global.service 2>/dev/null; then
    sudo systemctl restart hmh-global.service
  else
    echo "WARNING: Neither pm2 nor systemd service found."
  fi
fi

mkdir -p "$RemoteRoot/uploads"
sudo chown -R "$USER":"$USER" "$RemoteRoot/uploads"
find "$RemoteRoot/uploads" -type d -exec chmod 775 {} +

if [ -d /var/cache/nginx ]; then
  sudo find /var/cache/nginx -type f -delete || true
  sudo systemctl reload nginx || true
fi

echo "Deployment finished successfully."
"@

Info "Running remote deployment..."
ssh -i $SshKeyPath -p $SshPort "$SshUser@$SshHost" $remoteCmd

Info "Done."
