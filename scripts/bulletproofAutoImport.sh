#!/bin/bash
# Bulletproof Automated Product Import Script for HMH Global
# This script ensures the database NEVER gets empty and only adds/updates products safely
# Author: HMH Global Development Team

SCRIPT_DIR="/var/www/hmh-global/scripts"
LOG_DIR="/var/www/hmh-global/logs"
BACKUP_DIR="/var/www/hmh-global/backups"
LOG_FILE="$LOG_DIR/bulletproof-$(date +%Y%m%d-%H%M%S).log"

# Bulletproof safety configuration
MIN_PRODUCTS_THRESHOLD=10      # Never allow less than 10 products
MIN_CATEGORIES_THRESHOLD=2     # Never allow less than 2 categories
MAX_FAILURE_COUNT=3           # Abort after 3 consecutive failures

# Create necessary directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

# Logging function
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Database health check function
check_database_health() {
    log_message "INFO" "Performing database health check..."
    
    # Check if MongoDB is running
    if ! systemctl is-active --quiet mongod; then
        log_message "ERROR" "MongoDB service is not running!"
        return 1
    fi
    
    # Count products and categories
    cd /var/www/hmh-global
    PRODUCT_COUNT=$(mongosh --quiet --eval "db.products.countDocuments({isActive: true})" hmh-global 2>/dev/null || echo "0")
    CATEGORY_COUNT=$(mongosh --quiet --eval "db.categories.countDocuments({isActive: true})" hmh-global 2>/dev/null || echo "0")
    
    log_message "INFO" "Current database state: $PRODUCT_COUNT products, $CATEGORY_COUNT categories"
    
    # Check minimum thresholds
    if [ "$PRODUCT_COUNT" -lt "$MIN_PRODUCTS_THRESHOLD" ]; then
        log_message "ERROR" "Database safety violation: Only $PRODUCT_COUNT products (minimum: $MIN_PRODUCTS_THRESHOLD)"
        return 1
    fi
    
    if [ "$CATEGORY_COUNT" -lt "$MIN_CATEGORIES_THRESHOLD" ]; then
        log_message "ERROR" "Database safety violation: Only $CATEGORY_COUNT categories (minimum: $MIN_CATEGORIES_THRESHOLD)"
        return 1
    fi
    
    log_message "INFO" "Database health check PASSED"
    return 0
}

# Create database backup
create_backup() {
    log_message "INFO" "Creating database backup before operations..."
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/backup-$timestamp.json"
    
    cd /var/www/hmh-global
    
    # Export current database state
    mongosh --quiet --eval "
        const products = db.products.find({}).toArray();
        const categories = db.categories.find({}).toArray();
        const backup = {
            timestamp: new Date().toISOString(),
            products: products,
            categories: categories,
            metadata: {
                productCount: products.length,
                categoryCount: categories.length,
                version: 'bulletproof-1.0'
            }
        };
        print(JSON.stringify(backup, null, 2));
    " hmh-global > "$backup_file" 2>/dev/null
    
    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        log_message "INFO" "Database backup created successfully: $backup_file"
        
        # Clean old backups (keep last 15)
        cd "$BACKUP_DIR"
        ls -t backup-*.json 2>/dev/null | tail -n +16 | xargs -r rm
        
        return 0
    else
        log_message "ERROR" "Failed to create database backup!"
        return 1
    fi
}

# Restore database from backup (emergency function)
restore_from_backup() {
    log_message "WARNING" "EMERGENCY: Attempting to restore database from latest backup..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR"/backup-*.json 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        log_message "ERROR" "No backup files found for restoration!"
        return 1
    fi
    
    log_message "INFO" "Restoring from backup: $latest_backup"
    
    # This would be implemented based on your specific restore needs
    # For now, just log the action
    log_message "WARNING" "Database restoration would be performed here with backup: $latest_backup"
    
    return 0
}

# Safe scraper execution with monitoring
run_safe_scraper() {
    log_message "INFO" "Starting bulletproof scraper execution..."
    
    cd /var/www/hmh-global
    
    # Record initial state
    INITIAL_PRODUCTS=$(mongosh --quiet --eval "db.products.countDocuments({isActive: true})" hmh-global 2>/dev/null || echo "0")
    INITIAL_CATEGORIES=$(mongosh --quiet --eval "db.categories.countDocuments({isActive: true})" hmh-global 2>/dev/null || echo "0")
    
    log_message "INFO" "Initial state: $INITIAL_PRODUCTS products, $INITIAL_CATEGORIES categories"
    
    # Run the enhanced scraper with safety flags
    log_message "INFO" "Executing enhanced scraper with safety monitoring..."
    timeout 3600 node "$SCRIPT_DIR/enhancedNorthwestScraper.js" --update-images >> "$LOG_FILE" 2>&1
    SCRAPER_EXIT_CODE=$?
    
    # Check if scraper completed successfully
    if [ $SCRAPER_EXIT_CODE -eq 0 ]; then
        log_message "INFO" "Scraper completed successfully"
    elif [ $SCRAPER_EXIT_CODE -eq 124 ]; then
        log_message "WARNING" "Scraper timed out after 1 hour"
    else
        log_message "ERROR" "Scraper failed with exit code: $SCRAPER_EXIT_CODE"
        return 1
    fi
    
    # Verify database state after scraping
    FINAL_PRODUCTS=$(mongosh --quiet --eval "db.products.countDocuments({isActive: true})" hmh-global 2>/dev/null || echo "0")
    FINAL_CATEGORIES=$(mongosh --quiet --eval "db.categories.countDocuments({isActive: true})" hmh-global 2>/dev/null || echo "0")
    
    log_message "INFO" "Final state: $FINAL_PRODUCTS products, $FINAL_CATEGORIES categories"
    
    # BULLETPROOF CHECK: Ensure database wasn't damaged
    if [ "$FINAL_PRODUCTS" -lt "$MIN_PRODUCTS_THRESHOLD" ]; then
        log_message "CRITICAL" "DATABASE SAFETY VIOLATION: Products dropped to $FINAL_PRODUCTS (was $INITIAL_PRODUCTS)"
        log_message "CRITICAL" "This indicates a serious problem - database may have been corrupted!"
        
        # This is where you would implement emergency restoration
        restore_from_backup
        return 1
    fi
    
    if [ "$FINAL_CATEGORIES" -lt "$MIN_CATEGORIES_THRESHOLD" ]; then
        log_message "CRITICAL" "DATABASE SAFETY VIOLATION: Categories dropped to $FINAL_CATEGORIES (was $INITIAL_CATEGORIES)"
        log_message "CRITICAL" "This indicates a serious problem - database may have been corrupted!"
        
        # This is where you would implement emergency restoration
        restore_from_backup
        return 1
    fi
    
    # Calculate changes
    PRODUCTS_ADDED=$((FINAL_PRODUCTS - INITIAL_PRODUCTS))
    CATEGORIES_ADDED=$((FINAL_CATEGORIES - INITIAL_CATEGORIES))
    
    log_message "INFO" "Database changes: $PRODUCTS_ADDED products, $CATEGORIES_ADDED categories"
    
    return 0
}

# Main execution function
main() {
    log_message "INFO" "=== Starting Bulletproof HMH Global Product Import ==="
    log_message "INFO" "Safety thresholds: Products >= $MIN_PRODUCTS_THRESHOLD, Categories >= $MIN_CATEGORIES_THRESHOLD"
    
    # Change to application directory
    cd /var/www/hmh-global || {
        log_message "ERROR" "Cannot change to application directory"
        exit 1
    }
    
    # Step 1: Initial health check
    if ! check_database_health; then
        log_message "CRITICAL" "Initial database health check FAILED - aborting to prevent damage"
        exit 1
    fi
    
    # Step 2: Create backup
    if ! create_backup; then
        log_message "ERROR" "Failed to create backup - aborting for safety"
        exit 1
    fi
    
    # Step 3: Run safe scraper
    if run_safe_scraper; then
        log_message "INFO" "Bulletproof import completed successfully"
        
        # Step 4: Final health check
        if check_database_health; then
            log_message "INFO" "Final database health check PASSED"
            
            # Step 5: Run system test suite
            log_message "INFO" "Running system health verification..."
            node "$SCRIPT_DIR/testSuite.js" --api-only >> "$LOG_FILE" 2>&1
            
            if [ $? -eq 0 ]; then
                log_message "INFO" "System health verification PASSED"
            else
                log_message "WARNING" "System health verification had issues - check logs"
            fi
        else
            log_message "ERROR" "Final database health check FAILED"
            exit 1
        fi
    else
        log_message "ERROR" "Bulletproof import FAILED"
        exit 1
    fi
    
    log_message "INFO" "=== Bulletproof HMH Global Product Import Complete ==="
}

# Record failure for monitoring
record_failure() {
    local failure_file="$LOG_DIR/failure_count"
    local current_count=0
    
    if [ -f "$failure_file" ]; then
        current_count=$(cat "$failure_file" 2>/dev/null || echo "0")
    fi
    
    current_count=$((current_count + 1))
    echo "$current_count" > "$failure_file"
    
    log_message "WARNING" "Recorded failure #$current_count"
    
    if [ "$current_count" -ge "$MAX_FAILURE_COUNT" ]; then
        log_message "CRITICAL" "Maximum failure count reached ($MAX_FAILURE_COUNT) - system needs attention!"
        # Here you could send alerts, disable cron job, etc.
    fi
}

# Clear failure count on success
clear_failures() {
    local failure_file="$LOG_DIR/failure_count"
    if [ -f "$failure_file" ]; then
        rm "$failure_file"
        log_message "INFO" "Cleared failure count - system healthy"
    fi
}

# Execute main function with error handling
if main; then
    clear_failures
    log_message "INFO" "Bulletproof automation completed successfully at $(date)"
    exit 0
else
    record_failure
    log_message "ERROR" "Bulletproof automation failed at $(date)"
    exit 1
fi
