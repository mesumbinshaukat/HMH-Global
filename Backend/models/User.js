const { users, databases, DATABASE_ID, COLLECTIONS } = require('../config/appwrite');
const { ID, Query } = require('node-appwrite');

class User {
    constructor() {
        this.collectionId = COLLECTIONS.USERS;
        this.databaseId = DATABASE_ID;
    }

    // Create user profile in database
    async createProfile(userId, userData) {
        try {
            const profile = await databases.createDocument(
                this.databaseId,
                this.collectionId,
                userId,
                {
                    userId: userId,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    phone: userData.phone || '',
                    address: userData.address || {},
                    role: userData.role || 'customer',
                    preferences: userData.preferences || {},
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );
            return profile;
        } catch (error) {
            throw new Error(`Error creating user profile: ${error.message}`);
        }
    }

    // Get user profile
    async getProfile(userId) {
        try {
            const profile = await databases.getDocument(
                this.databaseId,
                this.collectionId,
                userId
            );
            return profile;
        } catch (error) {
            throw new Error(`Error fetching user profile: ${error.message}`);
        }
    }

    // Update user profile
    async updateProfile(userId, updateData) {
        try {
            const profile = await databases.updateDocument(
                this.databaseId,
                this.collectionId,
                userId,
                {
                    ...updateData,
                    updatedAt: new Date().toISOString()
                }
            );
            return profile;
        } catch (error) {
            throw new Error(`Error updating user profile: ${error.message}`);
        }
    }

    // Get all users (admin only)
    async getAll(limit = 25, offset = 0) {
        try {
            const profiles = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.limit(limit),
                    Query.offset(offset),
                    Query.orderDesc('createdAt')
                ]
            );
            return profiles;
        } catch (error) {
            throw new Error(`Error fetching users: ${error.message}`);
        }
    }

    // Delete user profile
    async deleteProfile(userId) {
        try {
            await databases.deleteDocument(
                this.databaseId,
                this.collectionId,
                userId
            );
            return { success: true, message: 'User profile deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting user profile: ${error.message}`);
        }
    }
}

module.exports = User;
