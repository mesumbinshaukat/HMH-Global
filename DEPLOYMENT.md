# HMH Global - Safe Deployment Guide

## 🚀 Deployment Strategy

This repository uses a **safe, zero-downtime deployment strategy** to ensure your live website at `hmhglobal.co.uk` continues running without interruption.

## 📋 Prerequisites

### GitHub Secrets Required
Make sure these secrets are configured in your GitHub repository:

- `VPS_HOST`: `138.68.184.23`
- `VPS_USERNAME`: `root`
- `VPS_SSH_KEY`: Your private SSH key
- `VPS_PORT`: `22` (optional, defaults to 22)

### VPS Requirements
- PM2 installed and configured
- Nginx configured with SSL (currently working)
- MongoDB running locally
- Node.js 18+ installed

## 🔄 Deployment Process

### Automatic Deployment
- **Trigger**: Push to `main` or `master` branch
- **Process**: Runs tests → Builds frontend → Deploys safely to production

### Manual Deployment
You can also trigger deployments manually:
1. Go to Actions tab in GitHub
2. Select "Deploy to VPS" workflow
3. Click "Run workflow"
4. Choose environment (production/staging)

## 🛡️ Safety Features

### 1. Pre-deployment Checks
- ✅ Website accessibility check
- ✅ PM2 process status
- ✅ Disk space verification

### 2. Backup Strategy
- 📦 Full backup created before each deployment
- 🗂️ Last 5 backups are kept automatically
- 🔄 Instant rollback capability

### 3. Graceful Deployment
- 🔄 Zero-downtime deployment
- 📁 Preserves uploads and environment files
- ⚡ Atomic deployment (all-or-nothing)

### 4. Health Checks
- 🏥 PM2 process verification
- 🌐 API response testing
- 🔍 External website accessibility check
- 🔙 Automatic rollback on failure

## 📁 What Gets Deployed

### Backend Files
- All Node.js application files
- Package.json and dependencies
- Controllers, models, routes, middleware
- Scripts and configuration files

### Frontend Files
- **Built React application** (not source code)
- Optimized static assets
- Production-ready bundle

### Preserved Files
- `.env` (environment variables)
- `uploads/` (user uploaded files)
- `node_modules/` (when unchanged)

## 🔧 Local Development

### Backend
```bash
cd Backend
npm install
npm run dev  # Uses nodemon for development
```

### Frontend
```bash
cd Frontend/hmh-global-frontend
npm install
npm start  # Development server on localhost:3000
```

### Development URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🚨 Emergency Procedures

### Manual Rollback
If automatic rollback fails:
```bash
ssh root@138.68.184.23
cd /var/www/hmh-global
pm2 stop hmh-api
mv hmh-global hmh-global.failed
mv hmh-global.old hmh-global
cd hmh-global
pm2 start index.js --name "hmh-api" --env production
```

### Restore from Backup
```bash
ssh root@138.68.184.23
cd /var/backups/hmh-global
ls -la  # List available backups
tar -xzf full-backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/
cd /var/www/hmh-global
pm2 restart hmh-api
```

## 📊 Monitoring

### Check Application Status
```bash
ssh root@138.68.184.23
pm2 status          # PM2 processes
pm2 logs hmh-api     # Application logs
systemctl status nginx  # Nginx status
```

### Website Health
- Production: https://hmhglobal.co.uk
- API Health: https://hmhglobal.co.uk/api/
- SSL Certificate: Auto-renewed via Let's Encrypt

## 🔍 Troubleshooting

### Common Issues

**1. PM2 Process Not Starting**
```bash
cd /var/www/hmh-global
pm2 delete hmh-api
pm2 start index.js --name "hmh-api" --env production
pm2 save
```

**2. Nginx Not Serving Files**
```bash
sudo systemctl reload nginx
sudo systemctl status nginx
```

**3. Database Connection Issues**
```bash
systemctl status mongodb
mongo  # Test MongoDB connection
```

### Log Locations
- PM2 Logs: `~/.pm2/logs/`
- Nginx Logs: `/var/log/nginx/`
- Application Logs: `/var/www/hmh-global/logs/`

## 🎯 Best Practices

1. **Always test locally first**
2. **Use feature branches for development**
3. **Monitor deployment logs during releases**
4. **Keep environment variables secure**
5. **Test critical functionality after deployment**

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review PM2 and Nginx logs
3. Verify database connectivity
4. Test API endpoints manually

---

**⚠️ Important**: This deployment strategy is designed to be safe and preserve your live website. The automated rollback ensures your site stays online even if something goes wrong during deployment.
