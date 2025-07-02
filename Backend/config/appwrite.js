const { Client, Databases, Storage, Account, Users } = require('node-appwrite');

// Initialize Appwrite Client
const client = new Client();

client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

// Initialize Appwrite services
const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);
const users = new Users(client);

// Export configured services
module.exports = {
    client,
    databases,
    storage,
    account,
    users,
    // Database and collection IDs from environment
    DATABASE_ID: process.env.APPWRITE_DATABASE_ID,
    COLLECTIONS: {
        PRODUCTS: process.env.PRODUCTS_COLLECTION_ID,
        USERS: process.env.USERS_COLLECTION_ID,
        ORDERS: process.env.ORDERS_COLLECTION_ID,
        CATEGORIES: process.env.CATEGORIES_COLLECTION_ID
    },
    STORAGE_BUCKET_ID: process.env.STORAGE_BUCKET_ID
};
