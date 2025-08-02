#!/bin/bash
# Automated product import script for HMH Global
# This script runs the enhanced Northwest Cosmetics scraper and logs the results

SCRIPT_DIR="/var/www/hmh-global/scripts"
LOG_DIR="/var/www/hmh-global/logs"
LOG_FILE="$LOG_DIR/scraper-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Change to the app directory
cd /var/www/hmh-global

# Run the enhanced scraper and log everything
echo "Starting Northwest Cosmetics scraper at $(date)" >> "$LOG_FILE"
echo "Running with --update-images flag to refresh product data" >> "$LOG_FILE"

# Run the enhanced scraper with image updates enabled
node "$SCRIPT_DIR/enhancedNorthwestScraper.js" --update-images >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "Northwest Cosmetics scraper completed successfully at $(date)" >> "$LOG_FILE"
    echo "Running test suite to verify system health..." >> "$LOG_FILE"
    
    # Run the test suite to verify everything is working
    node "$SCRIPT_DIR/testSuite.js" --api-only >> "$LOG_FILE" 2>&1
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "System health check passed at $(date)" >> "$LOG_FILE"
    else
        echo "System health check failed at $(date)" >> "$LOG_FILE"
    fi
else
    echo "Northwest Cosmetics scraper failed with exit code $EXIT_CODE at $(date)" >> "$LOG_FILE"
fi

# Keep only the last 15 log files
cd "$LOG_DIR"
ls -t scraper-*.log 2>/dev/null | tail -n +16 | xargs -r rm

# Also clean up old import logs if they exist
ls -t import-*.log 2>/dev/null | tail -n +6 | xargs -r rm

exit $EXIT_CODE
