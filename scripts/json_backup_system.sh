#!/bin/bash

# Advanced JSON Backup & Recovery System for HMH Global
# Ensures data integrity with multi-collection support and safe recovery

SCRIPT_DIR="/var/www/hmh-global"
BACKUP_DIR="$SCRIPT_DIR/json-backups/advanced"
LOG_FILE="$SCRIPT_DIR/logs/json-recovery.log"

# Collections to back up
COLLECTIONS=("products" "categories" "users" "orders" "reviews" "contacts" "carts")

mkdir -p "$BACKUP_DIR" "$SCRIPT_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create a comprehensive backup of all specified collections
create_backup() {
    log "🚀 Starting comprehensive JSON backup..."
    local timestamp=$(date '+%Y%m%d-%H%M%S')
    local backup_file="$BACKUP_DIR/backup-$timestamp.json"
    
    local mongo_script=""
    for collection in "${COLLECTIONS[@]}"; do
        mongo_script+="const ${collection} = db.getCollection('$collection').find({}).toArray(); "
    done

    mongo_script+="print(JSON.stringify({"
    for collection in "${COLLECTIONS[@]}"; do
        mongo_script+="    $collection: $collection,"
    done
    mongo_script+="}, null, 2));"

    mongosh hmh-global --quiet --eval "$mongo_script" > "$backup_file"

    if [ -s "$backup_file" ]; then
        log "✅ Backup created: $backup_file"
        # Clean old backups
        ls -t "$BACKUP_DIR"/backup-*.json | tail -n +20 | xargs -r rm
    else
        log "❌ Failed to create backup"
        rm "$backup_file"
    fi
}

# Restore from the latest valid backup
restore_from_backup() {
    log "🔥 Triggering advanced JSON restore..."
    local latest_backup=$(ls -t "$BACKUP_DIR"/backup-*.json | head -n 1)

    if [ -z "$latest_backup" ]; then
        log "❌ No backups found to restore from."
        return 1
    fi

    log "🔍 Restoring from: $latest_backup"

    local restore_script=""
    for collection in "${COLLECTIONS[@]}"; do
        restore_script+="db.getCollection('$collection').deleteMany({}); "
        restore_script+="const ${collection}Data = JSON.parse(fs.readFileSync('$latest_backup', 'utf8')).${collection}; "
        restore_script+="if (${collection}Data && ${collection}Data.length > 0) { db.getCollection('$collection').insertMany(${collection}Data); } "
    done

    mongosh hmh-global --quiet --eval "$restore_script"
    log "✅ Restore completed."
}

# The main function to check the database state and act accordingly
main() {
    log "🎯 Starting JSON backup & recovery check..."

    local counts_script=""
    for collection in "${COLLECTIONS[@]}"; do
        counts_script+="db.getCollection('$collection').countDocuments(), "
    done

    local counts=$(mongosh hmh-global --quiet --eval "print([$counts_script])")
    log "📊 Current counts: $counts"

    # Always create a backup if the database is in a good state
    if [[ "$counts" == *"0,0,0,0,0,0,0"* ]]; then
        log "🚨 Database appears empty. Attempting restore."
        restore_from_backup
    else
        create_backup
    fi
    log "🏁 Check completed."
}

main

