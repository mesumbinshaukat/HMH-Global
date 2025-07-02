const { databases, DATABASE_ID, COLLECTIONS } = require('../config/appwrite');
const { ID, Query } = require('node-appwrite');

class Category {
    constructor() {
        this.collectionId = COLLECTIONS.CATEGORIES;
        this.databaseId = DATABASE_ID;
    }

    // Create a new category
    async create(categoryData) {
        try {
            const category = await databases.createDocument(
                this.databaseId,
                this.collectionId,
                ID.unique(),
                {
                    name: categoryData.name,
                    description: categoryData.description || '',
                    slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                    image: categoryData.image || '',
                    parentId: categoryData.parentId || null,
                    status: categoryData.status || 'active',
                    sortOrder: categoryData.sortOrder || 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );
            return category;
        } catch (error) {
            throw new Error(`Error creating category: ${error.message}`);
        }
    }

    // Get all categories
    async getAll(status = 'active') {
        try {
            const queries = [
                Query.equal('status', status),
                Query.orderAsc('sortOrder'),
                Query.orderAsc('name')
            ];

            const categories = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                queries
            );
            return categories;
        } catch (error) {
            throw new Error(`Error fetching categories: ${error.message}`);
        }
    }

    // Get category by ID
    async getById(categoryId) {
        try {
            const category = await databases.getDocument(
                this.databaseId,
                this.collectionId,
                categoryId
            );
            return category;
        } catch (error) {
            throw new Error(`Error fetching category: ${error.message}`);
        }
    }

    // Get category by slug
    async getBySlug(slug) {
        try {
            const categories = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.equal('slug', slug),
                    Query.equal('status', 'active')
                ]
            );
            return categories.documents[0] || null;
        } catch (error) {
            throw new Error(`Error fetching category by slug: ${error.message}`);
        }
    }

    // Update category
    async update(categoryId, updateData) {
        try {
            const category = await databases.updateDocument(
                this.databaseId,
                this.collectionId,
                categoryId,
                {
                    ...updateData,
                    updatedAt: new Date().toISOString()
                }
            );
            return category;
        } catch (error) {
            throw new Error(`Error updating category: ${error.message}`);
        }
    }

    // Delete category
    async delete(categoryId) {
        try {
            await databases.deleteDocument(
                this.databaseId,
                this.collectionId,
                categoryId
            );
            return { success: true, message: 'Category deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting category: ${error.message}`);
        }
    }

    // Get parent categories (categories with no parent)
    async getParentCategories() {
        try {
            const categories = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.isNull('parentId'),
                    Query.equal('status', 'active'),
                    Query.orderAsc('sortOrder'),
                    Query.orderAsc('name')
                ]
            );
            return categories;
        } catch (error) {
            throw new Error(`Error fetching parent categories: ${error.message}`);
        }
    }

    // Get subcategories of a parent category
    async getSubcategories(parentId) {
        try {
            const categories = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.equal('parentId', parentId),
                    Query.equal('status', 'active'),
                    Query.orderAsc('sortOrder'),
                    Query.orderAsc('name')
                ]
            );
            return categories;
        } catch (error) {
            throw new Error(`Error fetching subcategories: ${error.message}`);
        }
    }
}

module.exports = Category;
