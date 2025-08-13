// Advanced JSON Backup & Recovery Service for HMH Global
// Automatically maintains JSON backups synchronized with MongoDB operations
// Author: HMH Global Development Team

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

class JSONBackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '../json-backups/realtime');
        this.logFile = path.join(__dirname, '../logs/json-backup-service.log');
        this.collections = ['products', 'categories', 'users', 'orders', 'reviews', 'contacts', 'carts'];
        this.isInitialized = false;
        this.backupInProgress = false;
        
        // Ensure directories exist
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            this.isInitialized = true;
            await this.log('info', 'JSON Backup Service initialized');
        } catch (error) {
            console.error('Failed to initialize JSON Backup Service:', error);
        }
    }

    async log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
        
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
        
        console.log(`[JSON-BACKUP] ${logEntry.trim()}`);
    }

    // Get the JSON file path for a collection
    getCollectionFilePath(collectionName) {
        return path.join(this.backupDir, `${collectionName}.json`);
    }

    // Load data from JSON file
    async loadFromJSON(collectionName) {
        try {
            const filePath = this.getCollectionFilePath(collectionName);
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.documents || [];
        } catch (error) {
            await this.log('warning', `Failed to load JSON for ${collectionName}`, { error: error.message });
            return [];
        }
    }

    // Save data to JSON file
    async saveToJSON(collectionName, documents) {
        if (this.backupInProgress) return;
        
        try {
            const filePath = this.getCollectionFilePath(collectionName);
            const backup = {
                collectionName,
                lastUpdated: new Date().toISOString(),
                count: documents.length,
                documents: documents.map(doc => {
                    // Convert mongoose document to plain object if needed
                    return doc.toObject ? doc.toObject() : doc;
                })
            };

            await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
            await this.log('info', `JSON backup updated for ${collectionName}`, { count: documents.length });
        } catch (error) {
            await this.log('error', `Failed to save JSON backup for ${collectionName}`, { error: error.message });
        }
    }

    // Get collection counts from both MongoDB and JSON
    async getCollectionStats() {
        const stats = {};
        
        for (const collectionName of this.collections) {
            try {
                // MongoDB count
                const mongoCount = await mongoose.connection.db.collection(collectionName).countDocuments();
                
                // JSON count
                const jsonData = await this.loadFromJSON(collectionName);
                const jsonCount = jsonData.length;
                
                stats[collectionName] = {
                    mongo: mongoCount,
                    json: jsonCount,
                    synced: mongoCount === jsonCount
                };
            } catch (error) {
                stats[collectionName] = {
                    mongo: 0,
                    json: 0,
                    synced: false,
                    error: error.message
                };
            }
        }
        
        return stats;
    }

    // Sync all collections from MongoDB to JSON
    async syncAllToJSON() {
        if (this.backupInProgress) {
            await this.log('warning', 'Backup already in progress, skipping sync');
            return;
        }

        this.backupInProgress = true;
        await this.log('info', 'Starting full sync from MongoDB to JSON');

        try {
            for (const collectionName of this.collections) {
                const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
                await this.saveToJSON(collectionName, documents);
            }
            await this.log('info', 'Full sync completed successfully');
        } catch (error) {
            await this.log('error', 'Full sync failed', { error: error.message });
        } finally {
            this.backupInProgress = false;
        }
    }

    // Restore collection from JSON to MongoDB
    async restoreFromJSON(collectionName) {
        try {
            await this.log('info', `Starting restore from JSON for ${collectionName}`);
            
            const jsonData = await this.loadFromJSON(collectionName);
            if (jsonData.length === 0) {
                await this.log('warning', `No JSON data found for ${collectionName}`);
                return false;
            }

            // Clear existing data
            await mongoose.connection.db.collection(collectionName).deleteMany({});
            
            // Insert JSON data
            if (jsonData.length > 0) {
                await mongoose.connection.db.collection(collectionName).insertMany(jsonData);
            }

            await this.log('info', `Restored ${jsonData.length} documents to ${collectionName}`);
            return true;
        } catch (error) {
            await this.log('error', `Failed to restore ${collectionName} from JSON`, { error: error.message });
            return false;
        }
    }

    // Auto recovery - restore empty collections from JSON
    async autoRecover() {
        await this.log('info', 'Starting auto-recovery check');
        
        const stats = await this.getCollectionStats();
        let recovered = 0;

        for (const [collectionName, stat] of Object.entries(stats)) {
            if (stat.mongo === 0 && stat.json > 0) {
                await this.log('warning', `Collection ${collectionName} is empty, attempting recovery`, stat);
                const success = await this.restoreFromJSON(collectionName);
                if (success) recovered++;
            }
        }

        await this.log('info', `Auto-recovery completed`, { collectionsRecovered: recovered });
        return recovered;
    }

    // Enhanced recovery - restore if JSON has more data than MongoDB
    async enhancedRecover() {
        await this.log('info', 'Starting enhanced recovery check');
        
        const stats = await this.getCollectionStats();
        let recovered = 0;

        for (const [collectionName, stat] of Object.entries(stats)) {
            if (stat.json > stat.mongo && stat.json > 0) {
                await this.log('warning', `Collection ${collectionName} has fewer documents than JSON backup`, stat);
                const success = await this.restoreFromJSON(collectionName);
                if (success) recovered++;
            }
        }

        await this.log('info', `Enhanced recovery completed`, { collectionsRecovered: recovered });
        return recovered;
    }

    // Middleware for automatic JSON backup on database operations
    createMiddleware() {
        return {
            // Post-save middleware
            postSave: async function(doc) {
                try {
                    const collectionName = this.collection.name;
                    if (jsonBackupService.collections.includes(collectionName)) {
                        // Get all documents from this collection
                        const documents = await this.constructor.find({});
                        await jsonBackupService.saveToJSON(collectionName, documents);
                    }
                } catch (error) {
                    console.error('JSON backup middleware error:', error);
                }
            },

            // Post-remove middleware
            postRemove: async function() {
                try {
                    const collectionName = this.collection.name;
                    if (jsonBackupService.collections.includes(collectionName)) {
                        // Get all remaining documents from this collection
                        const documents = await this.constructor.find({});
                        await jsonBackupService.saveToJSON(collectionName, documents);
                    }
                } catch (error) {
                    console.error('JSON backup middleware error:', error);
                }
            }
        };
    }

    // Generate comprehensive backup with metadata
    async createCompleteBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `complete-backup-${timestamp}.json`;
        const backupFilePath = path.join(this.backupDir, backupFileName);

        try {
            const stats = await this.getCollectionStats();
            const completeBackup = {
                timestamp: new Date().toISOString(),
                version: '2.0',
                stats,
                collections: {}
            };

            for (const collectionName of this.collections) {
                const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
                completeBackup.collections[collectionName] = documents;
            }

            await fs.writeFile(backupFilePath, JSON.stringify(completeBackup, null, 2));
            await this.log('info', `Complete backup created`, { file: backupFileName, collections: Object.keys(completeBackup.collections).length });
            
            return backupFilePath;
        } catch (error) {
            await this.log('error', 'Failed to create complete backup', { error: error.message });
            throw error;
        }
    }
}

// Create singleton instance
const jsonBackupService = new JSONBackupService();

// Export the service and middleware
module.exports = {
    jsonBackupService,
    JSONBackupService,
    
    // Helper function to attach middleware to models
    attachToModel: (model) => {
        const middleware = jsonBackupService.createMiddleware();
        
        // Attach post-save middleware
        model.schema.post('save', middleware.postSave);
        model.schema.post('insertMany', async function() {
            try {
                const documents = await model.find({});
                await jsonBackupService.saveToJSON(model.collection.name, documents);
            } catch (error) {
                console.error('JSON backup middleware error:', error);
            }
        });
        
        // Attach post-remove middleware  
        model.schema.post('remove', middleware.postRemove);
        model.schema.post('deleteOne', middleware.postRemove);
        model.schema.post('deleteMany', middleware.postRemove);
        model.schema.post('findOneAndDelete', middleware.postRemove);
        
        return model;
    }
};
