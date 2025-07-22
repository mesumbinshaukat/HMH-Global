# HMH Global - Production Deployment Guide

## Pre-Deployment Checklist ✅

Your project is now **PRODUCTION READY** with the following configurations:

### ✅ Frontend
- Built optimized production bundle
- Environment variables configured for production API URL
- All dependencies resolved

### ✅ Backend
- Production environment configuration
- CORS settings updated for production
- Static file serving configured
- Database connection ready
- PM2 ecosystem configuration

### ✅ Deployment Configuration
- Docker support (optional)
- Nginx reverse proxy configuration
- Auto-restart with PM2
- Production environment variables
- Deployment scripts

## How to Upload and Deploy Your Codebase

### Method 1: Using SCP (Recommended)

1. **Compress your project:**
```bash
# On Windows (PowerShell)
Compress-Archive -Path "D:\HMH-Global" -DestinationPath "hmh-global.zip"

# Or use 7zip/WinRAR to create hmh-global.zip
```

2. **Upload to server:**
```bash
scp hmh-global.zip root@138.68.184.23:/var/www/
```

3. **Connect to server and extract:**
```bash
ssh root@138.68.184.23
cd /var/www
unzip hmh-global.zip
mv HMH-Global hmh-global
cd hmh-global
```

### Method 2: Using Git (Alternative)

1. **Push to GitHub/GitLab:**
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

2. **Clone on server:**
```bash
ssh root@138.68.184.23
cd /var/www
git clone https://github.com/yourusername/hmh-global.git
cd hmh-global
```

### Method 3: Direct File Transfer (Windows)

Use WinSCP or FileZilla:
- Host: 138.68.184.23
- Username: root
- Upload entire project to /var/www/hmh-global

## Server Setup and Deployment

### 1. Initial Server Setup
```bash
ssh root@138.68.184.23
chmod +x deploy.sh
./deploy.sh
```

### 2. Deploy Application
```bash
chmod +x start-production.sh
./start-production.sh
```

### 3. Verify Deployment
```bash
# Check if application is running
pm2 status

# Check logs
pm2 logs hmh-global

# Check nginx status
sudo systemctl status nginx

# Test the application
curl http://localhost:5000
```

## Environment Variables Setup

Before starting the application, ensure these environment variables are configured:

### Backend (.env.production)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hmh-global
JWT_SECRET=mySuperSecretKey12345!
SMTP_USER=eventsphere@worldoftech.company
SMTP_PASS=World-of-tech-2024
SMTP_HOSTNAME=smtp.hostinger.com
SMTP_PORT=465
FRONTEND_URL=http://138.68.184.23:3000
NODE_ENV=production
```

## Access Points

Once deployed, your application will be accessible at:

- **Main Application:** http://138.68.184.23
- **API Endpoints:** http://138.68.184.23/api/*
- **Admin Dashboard:** http://138.68.184.23/admin

## Monitoring and Management

### PM2 Commands
```bash
pm2 status                 # Check status
pm2 restart hmh-global     # Restart application
pm2 stop hmh-global        # Stop application
pm2 logs hmh-global        # View logs
pm2 monit                  # Real-time monitoring
```

### Nginx Commands
```bash
sudo systemctl restart nginx    # Restart Nginx
sudo nginx -t                   # Test configuration
sudo systemctl status nginx     # Check status
```

## Troubleshooting

### Common Issues and Solutions

1. **Port already in use:**
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

2. **Permission issues:**
```bash
sudo chown -R $USER:$USER /var/www/hmh-global
```

3. **MongoDB connection issues:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

4. **Nginx configuration errors:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Security Recommendations

1. **Firewall Setup:**
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

2. **SSL Certificate (Optional):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Backup Strategy

1. **Database Backup:**
```bash
mongodump --db hmh-global --out /backup/
```

2. **Application Backup:**
```bash
tar -czf /backup/hmh-global-$(date +%Y%m%d).tar.gz /var/www/hmh-global
```

---

Your HMH Global E-commerce platform is now ready for production deployment! 🚀
