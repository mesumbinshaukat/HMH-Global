// ensureCartIndexes.js
// Ensures correct indexes for hybrid cart (guest/user) in MongoDB
// Run this script at backend startup

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function ensureCartIndexes() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('[ensureCartIndexes] MONGO_URI not set!');
    process.exit(1);
  }
  // Only connect if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
  const db = mongoose.connection;
  const carts = db.collection('carts');

  // 1. Remove any unique index on user
  const indexes = await carts.indexes();
  for (const idx of indexes) {
    if (idx.key && idx.key.user === 1 && idx.unique) {
      console.log('[ensureCartIndexes] Dropping unique index on user:', idx.name);
      await carts.dropIndex(idx.name);
    }
  }

  // 2. Add partial unique index on user (only when user is not null)
  const partialIndexName = 'user_unique_not_null';
  const existing = (await carts.indexes()).find(
    idx => idx.name === partialIndexName
  );
  if (!existing) {
    console.log('[ensureCartIndexes] Creating partial unique index on user (user not null)');
    await carts.createIndex(
      { user: 1 },
      {
        unique: true,
        name: partialIndexName,
        partialFilterExpression: { user: { $type: 'objectId' } },
      }
    );
  } else {
    console.log('[ensureCartIndexes] Partial unique index already exists.');
  }

  // Only disconnect if this script is run directly
  if (require.main === module) {
    await mongoose.disconnect();
    console.log('[ensureCartIndexes] Indexes ensured.');
  }
}

if (require.main === module) {
  ensureCartIndexes().catch((err) => {
    console.error('[ensureCartIndexes] Error:', err);
    process.exit(1);
  });
}

module.exports = ensureCartIndexes; 