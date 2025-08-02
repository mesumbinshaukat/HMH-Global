// Database Health Monitor for HMH Global
// Continuously monitors database integrity and prevents data loss
// Usage: node databaseMonitor.js [--alert-threshold=10]
// Author: HMH Global Development Team

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Configuration
const CONFIG = {
    MONITOR_INTERVAL: 60000,  // Check every 60 seconds
    MIN_PRODUCTS_THRESHOLD: process.argv.find(arg => arg.startsWith('--alert-threshold='))?.split('=')[1] || 10,
    MIN_CATEGORIES_THRESHOLD: 2,
    MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
    ALERT_COOLDOWN: 300000, // 5 minutes between alerts
    LOG_FILE: path.join(__dirname, '../logs/database-monitor.log')
};

// State tracking
let lastAlertTime = 0;
let previousCounts = { products: 0, categories: 0 };
let alertsSent = 0;

// Logging function
const log = (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
    
    console.log(logEntry.trim());
    
    try {
        // Ensure log directory exists
        const logDir = path.dirname(CONFIG.LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Rotate log if too large
        if (fs.existsSync(CONFIG.LOG_FILE)) {
            const stats = fs.statSync(CONFIG.LOG_FILE);
            if (stats.size > CONFIG.MAX_LOG_SIZE) {
                fs.renameSync(CONFIG.LOG_FILE, CONFIG.LOG_FILE + '.old');
            }
        }
        
        fs.appendFileSync(CONFIG.LOG_FILE, logEntry);
    } catch (err) {
        console.error('Failed to write to log file:', err.message);
    }
};

// Database health check
const checkDatabaseHealth = async () => {
    try {
        const [productCount, categoryCount] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Category.countDocuments({ isActive: true })
        ]);
        
        const health = {
            timestamp: new Date().toISOString(),
            products: productCount,
            categories: categoryCount,
            healthy: productCount >= CONFIG.MIN_PRODUCTS_THRESHOLD && categoryCount >= CONFIG.MIN_CATEGORIES_THRESHOLD,
            changes: {
                products: productCount - previousCounts.products,
                categories: categoryCount - previousCounts.categories
            }
        };
        
        // Update previous counts
        previousCounts = { products: productCount, categories: categoryCount };
        
        return health;
    } catch (error) {
        log('error', 'Failed to check database health', { error: error.message });
        return {
            timestamp: new Date().toISOString(),
            products: 0,
            categories: 0,
            healthy: false,
            error: error.message
        };
    }
};

// Send alert (placeholder - implement your preferred alerting method)
const sendAlert = (alertType, data) => {
    const now = Date.now();
    
    // Cooldown check
    if (now - lastAlertTime < CONFIG.ALERT_COOLDOWN) {
        return;
    }
    
    lastAlertTime = now;
    alertsSent++;
    
    log('critical', `ALERT #${alertsSent}: ${alertType}`, data);
    
    // Here you could implement:
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - Disable cron jobs
    // - Create emergency backups
    
    // For now, just create an alert file
    const alertFile = path.join(__dirname, '../logs/database-alert.json');
    const alertData = {
        alertId: alertsSent,
        timestamp: new Date().toISOString(),
        type: alertType,
        data,
        acknowledged: false
    };
    
    fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
};

// Emergency backup creation
const createEmergencyBackup = async () => {
    try {
        log('warning', 'Creating emergency database backup');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '../backups/emergency');
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const [products, categories] = await Promise.all([
            Product.find({}).lean(),
            Category.find({}).lean()
        ]);
        
        const backupData = {
            timestamp: new Date().toISOString(),
            emergency: true,
            products,
            categories,
            metadata: {
                productCount: products.length,
                categoryCount: categories.length,
                trigger: 'database-monitor-alert'
            }
        };
        
        const backupFile = path.join(backupDir, `emergency-backup-${timestamp}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        log('info', 'Emergency backup created', { backupFile, productCount: products.length });
        return backupFile;
    } catch (error) {
        log('error', 'Failed to create emergency backup', { error: error.message });
        return null;
    }
};

// Main monitoring loop
const monitorDatabase = async () => {
    log('info', 'Starting database health monitoring', {
        interval: CONFIG.MONITOR_INTERVAL / 1000 + 's',
        thresholds: {
            products: CONFIG.MIN_PRODUCTS_THRESHOLD,
            categories: CONFIG.MIN_CATEGORIES_THRESHOLD
        }
    });
    
    while (true) {
        try {
            const health = await checkDatabaseHealth();
            
            // Log regular health status (less verbose)
            if (health.healthy) {
                if (health.changes.products !== 0 || health.changes.categories !== 0) {
                    log('info', 'Database health check - changes detected', health);
                }
                // Only log every 10 minutes if no changes
                else if (Date.now() % (10 * 60 * 1000) < CONFIG.MONITOR_INTERVAL) {
                    log('info', 'Database health check - stable', { 
                        products: health.products, 
                        categories: health.categories 
                    });
                }
            } else {
                log('warning', 'Database health check - UNHEALTHY', health);
                
                // Check for critical conditions
                if (health.products < CONFIG.MIN_PRODUCTS_THRESHOLD) {
                    sendAlert('CRITICAL_LOW_PRODUCTS', {
                        current: health.products,
                        threshold: CONFIG.MIN_PRODUCTS_THRESHOLD,
                        health
                    });
                    
                    // Create emergency backup
                    await createEmergencyBackup();
                }
                
                if (health.categories < CONFIG.MIN_CATEGORIES_THRESHOLD) {
                    sendAlert('CRITICAL_LOW_CATEGORIES', {
                        current: health.categories,
                        threshold: CONFIG.MIN_CATEGORIES_THRESHOLD,
                        health
                    });
                }
                
                // Check for sudden drops
                if (health.changes.products < -10) {
                    sendAlert('SUDDEN_PRODUCT_DROP', {
                        dropped: Math.abs(health.changes.products),
                        health
                    });
                }
            }
            
        } catch (error) {
            log('error', 'Monitoring loop error', { error: error.message });
            
            sendAlert('MONITOR_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        
        // Wait for next check
        await new Promise(resolve => setTimeout(resolve, CONFIG.MONITOR_INTERVAL));
    }
};

// Graceful shutdown
const shutdown = async () => {
    log('info', 'Database monitor shutting down');
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start monitoring
const startMonitor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('info', 'Connected to MongoDB for monitoring');
        
        // Initial health check
        const initialHealth = await checkDatabaseHealth();
        log('info', 'Initial database health', initialHealth);
        
        // Start monitoring loop
        await monitorDatabase();
    } catch (error) {
        log('error', 'Failed to start database monitor', { error: error.message });
        process.exit(1);
    }
};

// Export for external use
module.exports = { checkDatabaseHealth, startMonitor };

// Run if called directly
if (require.main === module) {
    startMonitor().catch(console.error);
}
