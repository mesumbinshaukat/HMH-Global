// Model Integration for JSON Backup System
// Automatically integrates JSON backup middleware with all existing models
// Author: HMH Global Development Team

const { attachToModel } = require('../services/jsonBackupService');

// Import all models
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Contact = require('../models/Contact');
const Cart = require('../models/Cart');

// Attach JSON backup middleware to all models
console.log('🔧 Integrating JSON backup middleware with models...');

// Attach middleware to each model
const integratedModels = {
    Product: attachToModel(Product),
    Category: attachToModel(Category),
    User: attachToModel(User),
    Order: attachToModel(Order),
    Review: attachToModel(Review),
    Contact: attachToModel(Contact),
    Cart: attachToModel(Cart)
};

console.log('✅ JSON backup middleware attached to all models');

// Enhanced save method that includes JSON backup
const enhanceSaveMethod = (Model, modelName) => {
    const originalSave = Model.prototype.save;
    
    Model.prototype.save = async function(options) {
        try {
            // Call original save method
            const result = await originalSave.call(this, options);
            
            // Trigger JSON backup for this collection
            const { jsonBackupService } = require('../services/jsonBackupService');
            const documents = await Model.find({});
            await jsonBackupService.saveToJSON(Model.collection.name, documents);
            
            return result;
        } catch (error) {
            console.error(`Error in enhanced save for ${modelName}:`, error);
            throw error;
        }
    };
};

// Enhanced delete methods with JSON backup
const enhanceDeleteMethods = (Model, modelName) => {
    // Override deleteOne
    const originalDeleteOne = Model.deleteOne;
    Model.deleteOne = async function(filter, options) {
        try {
            const result = await originalDeleteOne.call(this, filter, options);
            
            // Trigger JSON backup
            const { jsonBackupService } = require('../services/jsonBackupService');
            const documents = await Model.find({});
            await jsonBackupService.saveToJSON(Model.collection.name, documents);
            
            return result;
        } catch (error) {
            console.error(`Error in enhanced deleteOne for ${modelName}:`, error);
            throw error;
        }
    };

    // Override deleteMany
    const originalDeleteMany = Model.deleteMany;
    Model.deleteMany = async function(filter, options) {
        try {
            const result = await originalDeleteMany.call(this, filter, options);
            
            // Trigger JSON backup
            const { jsonBackupService } = require('../services/jsonBackupService');
            const documents = await Model.find({});
            await jsonBackupService.saveToJSON(Model.collection.name, documents);
            
            return result;
        } catch (error) {
            console.error(`Error in enhanced deleteMany for ${modelName}:`, error);
            throw error;
        }
    };

    // Override findOneAndDelete
    const originalFindOneAndDelete = Model.findOneAndDelete;
    Model.findOneAndDelete = async function(filter, options) {
        try {
            const result = await originalFindOneAndDelete.call(this, filter, options);
            
            // Trigger JSON backup
            const { jsonBackupService } = require('../services/jsonBackupService');
            const documents = await Model.find({});
            await jsonBackupService.saveToJSON(Model.collection.name, documents);
            
            return result;
        } catch (error) {
            console.error(`Error in enhanced findOneAndDelete for ${modelName}:`, error);
            throw error;
        }
    };
};

// Apply enhancements to all models
Object.entries(integratedModels).forEach(([modelName, Model]) => {
    console.log(`🔧 Enhancing ${modelName} with JSON backup capabilities...`);
    enhanceSaveMethod(Model, modelName);
    enhanceDeleteMethods(Model, modelName);
});

console.log('✅ All models enhanced with JSON backup capabilities');

// Export enhanced models
module.exports = integratedModels;
