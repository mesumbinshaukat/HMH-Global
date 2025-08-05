#!/bin/bash

# Auto-Recovery Cron Job for HMH Global E-commerce
# Checks database health and triggers scraper if needed
# Also creates JSON backups of all products and categories

SCRIPT_DIR="/var/www/hmh-global"
LOG_FILE="$SCRIPT_DIR/logs/auto-recovery-$(date +%Y%m%d-%H%M%S).log"
JSON_BACKUP_DIR="$SCRIPT_DIR/json-backups"

# Create directories
mkdir -p "$JSON_BACKUP_DIR" "$SCRIPT_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

create_json_backup() {
    local timestamp=$(date '+%Y%m%d-%H%M%S')
    local json_file="$JSON_BACKUP_DIR/products-categories-$timestamp.json"
    
    log "💾 Creating JSON backup..."
    
    node -e "
        const { MongoClient } = require('mongodb');
        const fs = require('fs');
        
        (async () => {
            const client = new MongoClient('mongodb://localhost:27017');
            await client.connect();
            const db = client.db('hmh-global');
            
            const products = await db.collection('products').find({}).toArray();
            const categories = await db.collection('categories').find({}).toArray();
            
            const backup = {
                timestamp: new Date().toISOString(),
                products: products,
                categories: categories,
                counts: {
                    products: products.length,
                    categories: categories.length
                }
            };
            
            fs.writeFileSync('$json_file', JSON.stringify(backup, null, 2));
            console.log('JSON backup created with', products.length, 'products and', categories.length, 'categories');
            
            await client.close();
        })();
    " >> "$LOG_FILE" 2>&1
    
    if [ -f "$json_file" ]; then
        local size=$(du -h "$json_file" | cut -f1)
        log "✅ JSON backup created: $json_file ($size)"
        
        # Keep only last 10 JSON backups
        cd "$JSON_BACKUP_DIR"
        ls -t products-categories-*.json | tail -n +11 | xargs -r rm --
        
        return 0
    else
        log "❌ Failed to create JSON backup"
        return 1
    fi
}

check_and_recover() {
    log "🔍 Checking database health..."
    
    local product_count=$(mongosh hmh-global --quiet --eval 'db.products.countDocuments()')
    local category_count=$(mongosh hmh-global --quiet --eval 'db.categories.countDocuments()')
    
    log "📊 Current status: $product_count products, $category_count categories"
    
    # Create JSON backup first (always)
    create_json_backup
    
    # Check if recovery needed (less than 10 products or 2 categories)
    if [ "$product_count" -lt 10 ] || [ "$category_count" -lt 2 ]; then
        log "🚨 CRITICAL: Database below safety thresholds - triggering scraper!"
        
        cd "$SCRIPT_DIR"
        
        # Run enhanced scraper with reasonable limits
        log "🚀 Starting enhanced scraper (limited run)..."
        timeout 1800 node scripts/enhancedNorthwestScraper.js --limit=50 >> "$LOG_FILE" 2>&1
        
        if [ $? -eq 0 ]; then
            local new_product_count=$(mongosh hmh-global --quiet --eval 'db.products.countDocuments()')
            local new_category_count=$(mongosh hmh-global --quiet --eval 'db.categories.countDocuments()')
            
            log "✅ Scraper completed: $new_product_count products, $new_category_count categories"
            
            # Create another JSON backup after successful scraping
            create_json_backup
            
            if [ "$new_product_count" -gt 10 ] && [ "$new_category_count" -gt 2 ]; then
                log "🎉 Database recovery successful!"
            else
                log "⚠️ Database still below thresholds after scraping"
            fi
        else
            log "❌ Scraper failed or timed out"
        fi
    else
        log "✅ Database healthy - no recovery needed"
    fi
}

# Main execution
log "🎯 Starting auto-recovery check..."
check_and_recover
log "🏁 Auto-recovery check completed"
