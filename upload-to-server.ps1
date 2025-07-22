# HMH Global - Upload to Server Script (Windows)
Write-Host "HMH Global - Uploading to Production Server..." -ForegroundColor Green

# Compress the project
Write-Host "Compressing project files..." -ForegroundColor Yellow
Compress-Archive -Path "D:\HMH-Global" -DestinationPath "hmh-global.zip" -Force

# Upload using SCP (requires OpenSSH or PuTTY's pscp)
Write-Host "Uploading to server..." -ForegroundColor Yellow
Write-Host "Please enter server password when prompted" -ForegroundColor Cyan

try {
    # Try using built-in scp (Windows 10/11)
    scp hmh-global.zip root@138.68.184.23:/var/www/
    Write-Host "Upload completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Built-in SCP not available. Please use one of these alternatives:" -ForegroundColor Red
    Write-Host "1. Install OpenSSH: Settings > Apps > Optional Features > Add OpenSSH Client" -ForegroundColor Yellow
    Write-Host "2. Use WinSCP GUI: Download from https://winscp.net/" -ForegroundColor Yellow
    Write-Host "3. Use FileZilla: Download from https://filezilla-project.org/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual upload details:" -ForegroundColor Cyan
    Write-Host "Host: 138.68.184.23" -ForegroundColor White
    Write-Host "Username: root" -ForegroundColor White
    Write-Host "Upload hmh-global.zip to: /var/www/" -ForegroundColor White
}

Write-Host ""
Write-Host "Next steps after upload:" -ForegroundColor Green
Write-Host "1. SSH to server: ssh root@138.68.184.23" -ForegroundColor White
Write-Host "2. cd /var/www && unzip hmh-global.zip" -ForegroundColor White
Write-Host "3. mv HMH-Global hmh-global && cd hmh-global" -ForegroundColor White
Write-Host "4. chmod +x deploy.sh && ./deploy.sh" -ForegroundColor White
Write-Host "5. chmod +x start-production.sh && ./start-production.sh" -ForegroundColor White
