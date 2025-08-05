#!/bin/bash

# Emergency Database Recovery and Automated Scraping Script
# Professional solution for HMH Global E-commerce Platform

SCRIPT_DIR="/var/www/hmh-global"
LOG_FILE="$SCRIPT_DIR/logs/emergency-recovery-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="$SCRIPT_DIR/backups"
JSON_BACKUP_DIR="$SCRIPT_DIR/json-backups"

# Create directories
mkdir -p "$BACKUP_DIR" "$JSON_BACKUP_DIR" "$SCRIPT_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_database_health() {
    local product_count=$(mongosh hmh-global --quiet --eval 'db.products.countDocuments()')
    local category_count=$(mongosh hmh-global --quiet --eval 'db.categories.countDocuments()')
    
    log "📊 Database Status: $product_count products, $category_count categories"
    
    if [ "$product_count" -lt 10 ] || [ "$category_count" -lt 2 ]; then
        log "🚨 CRITICAL: Database below safety thresholds!"
        return 1
    fi
    return 0
}

create_json_backup() {
    local timestamp=$(date '+%Y%m%d-%H%M%S')
    local json_file="$JSON_BACKUP_DIR/products-categories-backup-$timestamp.json"
    
    log "💾 Creating JSON backup..."
    
    mongosh hmh-global --quiet --eval "
        const backup = {
            timestamp: new Date().toISOString(),
            products: db.products.find({}).toArray(),
            categories: db.categories.find({}).toArray()
        };
        print(JSON.stringify(backup, null, 2));
    " > "$json_file"
    
    if [ -f "$json_file" ]; then
        local size=$(du -h "$json_file" | cut -f1)
        log "✅ JSON backup created: $json_file ($size)"
        return 0
    else
        log "❌ Failed to create JSON backup"
        return 1
    fi
}

run_enhanced_scraper() {
    log "🚀 Starting Enhanced Northwest Scraper..."
    
    cd "$SCRIPT_DIR"
    
    # Run scraper with timeout protection
    timeout 3600 node scripts/enhancedNorthwestScraper.js >> "$LOG_FILE" 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log "✅ Scraper completed successfully"
        return 0
    elif [ $exit_code -eq 124 ]; then
        log "⏰ Scraper timed out after 1 hour"
        return 1
    else
        log "❌ Scraper failed with exit code: $exit_code"
        return 1
    fi
}

main() {
    log "🎯 Starting Emergency Database Recovery Process..."
    
    # Check if database needs recovery
    if ! check_database_health; then
        log "🔧 Database needs recovery - triggering scraper..."
        
        # Create backup before scraping (even if empty)
        create_json_backup
        
        # Run enhanced scraper
        if run_enhanced_scraper; then
            log "🎉 Scraper completed - checking results..."
            
            if check_database_health; then
                log "✅ Database recovery successful!"
                create_json_backup  # Create backup of restored data
            else
                log "❌ Database still unhealthy after scraping"
                exit 1
            fi
        else
            log "❌ Scraper failed - database recovery incomplete"
            exit 1
        fi
    else
        log "✅ Database is healthy - no action needed"
        # Still create a backup for safety
        create_json_backup
    fi
    
    log "🏁 Emergency recovery process completed"
}

# Run main function
main
