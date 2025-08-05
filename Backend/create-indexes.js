// Create MongoDB text indexes for search functionality

const mongoose = require('mongoose');
const Product = require('./models/Product');

async function createIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hmh-global');
        console.log('Connected to MongoDB');
        
        console.log('Creating text indexes...');
        await Product.createIndexes();
        console.log('✅ Text indexes created successfully');
        
        // Verify indexes exist
        const indexes = await Product.collection.getIndexes();
        console.log('Current indexes:', Object.keys(indexes));
        
        console.log('Index creation completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createIndexes();
