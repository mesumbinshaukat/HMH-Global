const fs = require('fs');
const { MongoClient } = require('mongodb');

async function restoreDatabase() {
  try {
    console.log('🔄 Loading backup data...');
    const backup = JSON.parse(fs.readFileSync('backups/backup-20250803-020004.json', 'utf8'));
    
    console.log(`📦 Found ${backup.products?.length || 0} products and ${backup.categories?.length || 0} categories in backup`);
    
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('hmh-global');
    
    // Clear and restore products
    console.log('🗑️ Clearing existing products...');
    await db.collection('products').deleteMany({});
    if (backup.products && backup.products.length > 0) {
      console.log('📥 Inserting products...');
      await db.collection('products').insertMany(backup.products);
    }
    
    // Clear and restore categories
    console.log('🗑️ Clearing existing categories...');
    await db.collection('categories').deleteMany({});  
    if (backup.categories && backup.categories.length > 0) {
      console.log('📥 Inserting categories...');
      await db.collection('categories').insertMany(backup.categories);
    }
    
    const finalProductCount = await db.collection('products').countDocuments();
    const finalCategoryCount = await db.collection('categories').countDocuments();
    
    console.log(`✅ Restoration complete: ${finalProductCount} products, ${finalCategoryCount} categories`);
    
    await client.close();
    console.log('🎉 Database restoration successful!');
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  }
}

restoreDatabase();
