#!/bin/bash

# HMH Global Production Startup Script
echo "Starting HMH Global in production mode..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Copy production environment files
cp Backend/.env.production Backend/.env

# Copy frontend build to backend public directory
cp -r Frontend/hmh-global-frontend/build/* Backend/public/ 2>/dev/null || mkdir -p Backend/public && cp -r Frontend/hmh-global-frontend/build/* Backend/public/

# Install backend dependencies
cd Backend
npm install --only=production

# Start with PM2
cd ..
pm2 start ecosystem.config.js --env production

# Setup nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/hmh-global
sudo ln -s /etc/nginx/sites-available/hmh-global /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo nginx -t && sudo systemctl restart nginx

echo "HMH Global is now running in production mode!"
echo "Access your application at: http://138.68.184.23"
