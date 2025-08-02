# HMH Global E-commerce Platform

A full-stack e-commerce platform built with React.js frontend and Node.js/Express backend, featuring automated product scraping from Northwest Cosmetics. Deployed on Ubuntu VPS with Nginx reverse proxy, MongoDB database, and automated daily product updates.

## 🌐 Live Demo

**Website**: [https://hmhglobal.co.uk](https://hmhglobal.co.uk)
**API**: [https://hmhglobal.co.uk/api](https://hmhglobal.co.uk/api)

## 📊 Production Stats
- **Products**: 1,194+ active products
- **Categories**: 8 organized categories
- **Images**: 3,500+ product images
- **Performance**: Sub-200ms API response times
- **Uptime**: 99.9% availability

## 🚀 Key Features
- **Full E-commerce Functionality**: Product catalog, shopping cart, order management
- **User Authentication**: JWT-based authentication with role-based access control
- **Admin Dashboard**: Product management, order tracking, user management
- **Product Search & Filtering**: Advanced search with category, price, and brand filters
- **Product Grid & Pagination**: Loading skeletons, error handling, and pagination
- **Web Scraping**: Automated product import from Northwest Cosmetics with real-time progress
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **File Uploads**: Product image management
- **Email Integration**: Order confirmations and notifications

## Authentication Flow
- **Login/Registration:**
  - Emails are always lowercased and trimmed on both backend and frontend.
  - JWT is returned on successful login and stored in localStorage.
- **API Requests:**
  - JWT sent in Authorization header (`Bearer ...`).
- **SSE (Scraping Progress):**
  - JWT sent as `?token=...` query parameter for `/api/admin/scrape-progress`.
- **Admin Routes:**
  - Protected by both `authMiddleware` and `roleMiddleware('admin')`.

## API Response Structure
- All API responses are wrapped in an `ApiResponse<T>` object:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "...",
    "error": "..."
  }
  ```
- Always access returned data via `.data` property in frontend code.

## Running the Project
1. **Backend:**
   - `cd Backend`
   - `npm install`
   - `npm start`
2. **Frontend:**
   - `cd Frontend/hmh-global-frontend`
   - `npm install`
   - `npm start`

## Troubleshooting
- **Login Issues:**
  - Ensure email is lowercased in DB and when logging in.
  - Check backend logs for `[UserController] loginUser found user: null`.
- **SSE/401 Errors:**
  - Ensure JWT is sent as `?token=...` in EventSource URL.
  - Backend must accept token from query for SSE endpoints.
- **API Response Errors:**
  - Always use `.data` from `ApiResponse<T>` in frontend.

## Migration Notes
- All email handling is now case-insensitive.
- SSE endpoints require token in query, not header.
- API response shape is consistent across all endpoints.

## 🖥️ Production Deployment

### Server Configuration
**VPS Details:**
- **IP Address**: 138.68.184.23
- **OS**: Ubuntu 24.10 (Oracular)
- **Domain**: hmhglobal.co.uk
- **SSL**: Let's Encrypt certificate
- **Web Server**: Nginx
- **Database**: MongoDB 7.0.22
- **Runtime**: Node.js 18.20.8

### Current Production Structure
```
/var/www/hmh-global/
├── public/               # React build files (served by nginx at root)
│   ├── index.html       # Main React app entry point
│   ├── static/         # CSS, JS, and media assets
│   ├── logo.jpeg       # HMH Global logo
│   └── manifest.json   # PWA manifest
├── Backend files:       # Node.js API server files (root level)
│   ├── controllers/    # API route controllers
│   ├── models/        # MongoDB schemas
│   ├── routes/        # Express routes
│   ├── middleware/    # Authentication & validation
│   ├── config/        # Database and app configuration
│   ├── index.js       # Main server entry point
│   └── package.json   # Node.js dependencies
├── scripts/            # Automation scripts
│   ├── enhancedNorthwestScraper.js  # Main product scraper
│   ├── testSuite.js                 # System health tests
│   └── autoImportProducts.sh        # Automated daily import
├── uploads/products/   # Product images (organized by product name)
│   └── [product_name]/ # Individual product image folders
├── logs/              # System and scraper logs
├── .env.production    # Production environment variables
├── NWC Pricelist.xlsx # Price reference file for scraper
└── node_modules/      # Node.js dependencies
```

### Local Development Structure
```
D:/HMH-Global/
├── Frontend/
│   └── hmh-global-frontend/  # React source code
│       ├── src/             # React components, pages, hooks
│       ├── public/          # Static assets
│       ├── build/          # Production build output
│       └── package.json    # Frontend dependencies
├── Backend/
│   ├── scripts/           # Server-side scripts
│   ├── controllers/       # API controllers
│   ├── models/           # Database models
│   └── [other backend files]
├── README.md            # This documentation
└── StatusReport.md      # Project completion report
```

### Nginx Configuration (`/etc/nginx/sites-available/hmh-global`)
```nginx
server {
    server_name hmhglobal.co.uk www.hmhglobal.co.uk 138.68.184.23;

    root /var/www/hmh-global/public;
    index index.html index.htm;

    location /uploads {
        alias /var/www/hmh-global/uploads;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/hmhglobal.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hmhglobal.co.uk/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.hmhglobal.co.uk) {
        return 301 https://$host$request_uri;
    }

    if ($host = hmhglobal.co.uk) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name hmhglobal.co.uk www.hmhglobal.co.uk 138.68.184.23;
    return 404; # managed by Certbot
}
```

### MongoDB Configuration
```bash
# Database: hmh-global
# Collections: products, categories, users, orders, reviews
# Connection: mongodb://localhost:27017/hmh-global
```

### Environment Variables (`.env.production`)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/hmh-global
JWT_SECRET=[secure-secret-key]
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://hmhglobal.co.uk
```

### Cron Jobs (`crontab -l`)
```bash
# Daily product import at 8:30 AM UTC
30 8 * * * /var/www/hmh-global/scripts/autoImportProducts.sh
```

### System Services
```bash
# Backend API service (PM2) - Currently running as 'hmh-api'
pm2 start /var/www/hmh-global/index.js --name "hmh-api"

# Nginx web server
sudo systemctl enable nginx
sudo systemctl start nginx

# MongoDB database
sudo systemctl enable mongod
sudo systemctl start mongod
```

### SSL Certificate Renewal
```bash
# Auto-renewal via certbot
0 12 * * * /usr/bin/certbot renew --quiet
```

### Log Files
```bash
# Application logs
/var/www/hmh-global/logs/scraper-*.log
/var/www/hmh-global/logs/import-*.log

# System logs
/var/log/nginx/access.log
/var/log/nginx/error.log
/var/log/mongodb/mongod.log
```

### Backup Strategy
```bash
# Database backup (recommended daily)
mongodump --db hmh-global --out /backup/mongodb/$(date +%Y%m%d)

# File system backup
tar -czf /backup/files/hmh-global-$(date +%Y%m%d).tar.gz /var/www/hmh-global
```

### Performance Monitoring
- **System Health**: Test suite runs automatically post-scrape
- **API Response Time**: < 200ms average (monitored via test suite)
- **Database Performance**: Indexed queries for optimal search
- **Image Optimization**: Nginx caching with 30-day expiry
- **SSL Performance**: HTTP/2 enabled with optimized ciphers

### Security Measures
- **HTTPS Enforced**: All traffic redirected to HTTPS
- **Security Headers**: XSS protection, content type validation
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all API endpoints
- **CORS Configuration**: Restricted to production domain

---
For more details, see `Backend/API_Documentation.txt` for endpoint-level docs.
