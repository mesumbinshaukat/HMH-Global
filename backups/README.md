# HMH Global Production Backups

This directory contains backup files from the live production server (138.68.184.23).

## Backup Files

### `hmh-global-production-backup-20250802-031600.tar.gz` (43MB)
- **Description**: Complete production server backup
- **Contents**: Full backend application including:
  - Node.js backend code and configuration
  - Database configuration files
  - Uploaded product images (`/uploads/` directory)
  - Frontend build files (`/public/` directory)
  - Environment configuration
  - PM2 process configuration
- **Created**: August 2, 2025 at 03:16:00 UTC
- **Server Path**: `/var/www/hmh-global/`

### `frontend-build-backup-20250802-031600.tar.gz` (4.2MB)
- **Description**: Frontend build files only
- **Contents**: Optimized React production build including:
  - Compiled JavaScript bundles
  - Optimized CSS files
  - Static assets (images, fonts, icons)
  - HTML template with all enhancements
- **Created**: August 2, 2025 at 03:16:00 UTC
- **Server Path**: `/var/www/hmh-global/public/`

## Deployment Status

- **Website URL**: http://138.68.184.23:5000
- **Status**: ✅ Live and Functional
- **Features Deployed**:
  - Advanced visual effects and animations
  - Professional CSS styling
  - Image fallback handling
  - Responsive design enhancements
  - Premium hover effects
  - Gradient backgrounds and animations

## Restoration Instructions

### To restore complete server:
```bash
# Extract full backup
tar -xzf hmh-global-production-backup-20250802-031600.tar.gz

# Copy to server location
cp -r hmh-global/ /var/www/

# Restart services
pm2 restart hmh-api
```

### To restore frontend only:
```bash
# Extract frontend backup
tar -xzf frontend-build-backup-20250802-031600.tar.gz

# Copy to server public directory
cp -r public/* /var/www/hmh-global/public/

# Restart server to serve new files
pm2 restart hmh-api
```

## Version Information

- **Frontend Framework**: React 18
- **Backend Framework**: Node.js with Express
- **Database**: MongoDB
- **Process Manager**: PM2
- **Server OS**: Ubuntu Linux

These backups represent the stable, production-ready version of HMH Global with all visual enhancements and professional features implemented.
