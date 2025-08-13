#!/bin/bash

# Enhanced Auto-Recovery System for HMH Global E-commerce
# Integrates JSON backup system with existing recovery mechanisms
# Provides bulletproof data protection and recovery

SCRIPT_DIR="/var/www/hmh-global"
LOG_FILE="$SCRIPT_DIR/logs/enhanced-recovery-$(date +%Y%m%d-%H%M%S).log"
JSON_BACKUP_DIR="$SCRIPT_DIR/json-backups/realtime"

# Safety thresholds
MIN_PRODUCTS=10
MIN_CATEGORIES=2
MIN_USERS=1

mkdir -p "$JSON_BACKUP_DIR" "$SCRIPT_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check database health and get detailed statistics
check_database_health() {
    log "🔍 Performing comprehensive database health check..."
    
    # Check MongoDB service
    if ! systemctl is-active --quiet mongod; then
        log "❌ MongoDB service is not running!"
        return 1
    fi
    
    # Get collection counts
    local mongo_script="
        const stats = {};
        const collections = ['products', 'categories', 'users', 'orders', 'reviews', 'contacts', 'carts'];
        for (const col of collections) {
            try {
                stats[col] = db.getCollection(col).countDocuments();
            } catch (e) {
                stats[col] = 0;
            }
        }
        print(JSON.stringify(stats));
    "
    
    local counts=$(mongosh hmh-global --quiet --eval "$mongo_script")
    log "📊 Database status: $counts"
    
    # Parse the counts (basic extraction)
    local product_count=$(echo "$counts" | grep -o '"products":[0-9]*' | cut -d':' -f2)
    local category_count=$(echo "$counts" | grep -o '"categories":[0-9]*' | cut -d':' -f2)
    local user_count=$(echo "$counts" | grep -o '"users":[0-9]*' | cut -d':' -f2)
    
    # Default to 0 if parsing fails
    product_count=${product_count:-0}
    category_count=${category_count:-0}
    user_count=${user_count:-0}
    
    # Check critical thresholds
    if [ "$product_count" -lt "$MIN_PRODUCTS" ] || [ "$category_count" -lt "$MIN_CATEGORIES" ]; then
        log "🚨 CRITICAL: Database below safety thresholds!"
        log "🚨 Products: $product_count (min: $MIN_PRODUCTS), Categories: $category_count (min: $MIN_CATEGORIES)"
        return 1
    fi
    
    log "✅ Database health check PASSED"
    return 0
}

# JSON Backup Management
create_json_backup() {
    log "💾 Creating enhanced JSON backup..."
    
    cd "$SCRIPT_DIR"
    
    # Use Node.js service to create backup
    node -e "
        const { jsonBackupService } = require('./services/jsonBackupService');
        const mongoose = require('mongoose');
        require('dotenv').config({ path: './.env.production' });
        
        (async () => {
            try {
                await mongoose.connect(process.env.MONGO_URI);
                await jsonBackupService.syncAllToJSON();
                const stats = await jsonBackupService.getCollectionStats();
                console.log('Backup completed:', JSON.stringify(stats, null, 2));
                await mongoose.disconnect();
            } catch (error) {
                console.error('Backup failed:', error.message);
                process.exit(1);
            }
        })();
    " >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ JSON backup completed successfully"
        return 0
    else
        log "❌ JSON backup failed"
        return 1
    fi
}

# Enhanced recovery from JSON backups
restore_from_json() {
    log "🔥 Starting enhanced JSON recovery..."
    
    cd "$SCRIPT_DIR"
    
    # Use Node.js service to restore from JSON
    node -e "
        const { jsonBackupService } = require('./services/jsonBackupService');
        const mongoose = require('mongoose');
        require('dotenv').config({ path: './.env.production' });
        
        (async () => {
            try {
                await mongoose.connect(process.env.MONGO_URI);
                
                // First try auto-recovery (empty collections)
                let recovered = await jsonBackupService.autoRecover();
                
                // Then try enhanced recovery (fewer documents than JSON)
                recovered += await jsonBackupService.enhancedRecover();
                
                const stats = await jsonBackupService.getCollectionStats();
                console.log('Recovery completed:', JSON.stringify({ recovered, stats }, null, 2));
                await mongoose.disconnect();
                
                process.exit(recovered > 0 ? 0 : 1);
            } catch (error) {
                console.error('Recovery failed:', error.message);
                process.exit(1);
            }
        })();
    " >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ JSON recovery completed successfully"
        return 0
    else
        log "❌ JSON recovery failed"
        return 1
    fi
}

# Fallback scraper if JSON recovery fails
run_fallback_scraper() {
    log "🚀 Running fallback scraper as last resort..."
    
    cd "$SCRIPT_DIR"
    timeout 1800 node scripts/enhancedNorthwestScraper.js --limit=30 >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ Fallback scraper completed"
        return 0
    else
        log "❌ Fallback scraper failed"
        return 1
    fi
}

# Monitor and alert system
send_alert() {
    local message="$1"
    log "🚨 ALERT: $message"
    
    # Log to special alert file
    echo "[$(date)] $message" >> "$SCRIPT_DIR/logs/alerts.log"
    
    # Could integrate with email/SMS alerts here
    # mail -s "HMH Global Database Alert" admin@hmh.com <<< "$message"
}

# Database monitoring and recovery logic
monitor_database() {
    log "👁️ Starting database monitoring cycle..."
    
    # Track recovery attempts
    local recovery_attempts=0
    local max_attempts=3
    
    while [ $recovery_attempts -lt $max_attempts ]; do
        if check_database_health; then
            # Database is healthy, create backup and exit
            create_json_backup
            log "✅ Database healthy, monitoring complete"
            return 0
        fi
        
        recovery_attempts=$((recovery_attempts + 1))
        log "⚠️ Database unhealthy, attempting recovery #$recovery_attempts"
        
        # Step 1: Try JSON recovery first (fastest)
        if restore_from_json; then
            log "🎉 Recovery successful via JSON backup"
            create_json_backup
            return 0
        fi
        
        # Step 2: Fallback to scraper if JSON recovery fails
        if [ $recovery_attempts -eq $max_attempts ]; then
            log "🆘 Final attempt: Running fallback scraper"
            if run_fallback_scraper; then
                log "🎉 Recovery successful via scraper"
                create_json_backup
                return 0
            fi
        fi
        
        # Wait before next attempt
        sleep 30
    done
    
    # All recovery attempts failed
    send_alert "CRITICAL: All database recovery attempts failed after $max_attempts tries"
    return 1
}

# Main execution
main() {
    log "🎯 Starting Enhanced Auto-Recovery System"
    log "🔧 Safety thresholds: Products≥$MIN_PRODUCTS, Categories≥$MIN_CATEGORIES, Users≥$MIN_USERS"
    
    # Run monitoring and recovery
    if monitor_database; then
        log "✅ Enhanced auto-recovery completed successfully"
        exit 0
    else
        log "❌ Enhanced auto-recovery FAILED - manual intervention required"
        exit 1
    fi
}

# Execute main function
main
