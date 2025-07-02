const { databases, DATABASE_ID, COLLECTIONS } = require('../config/appwrite');
const { ID, Query } = require('node-appwrite');

class Product {
    constructor() {
        this.collectionId = COLLECTIONS.PRODUCTS;
        this.databaseId = DATABASE_ID;
    }

    // Create a new product
    async create(productData) {
        try {
            const product = await databases.createDocument(
                this.databaseId,
                this.collectionId,
                ID.unique(),
                {
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    category: productData.category,
                    brand: productData.brand,
                    stock: productData.stock || 0,
                    images: productData.images || [],
                    featured: productData.featured || false,
                    status: productData.status || 'active',
                    rating: productData.rating || 0,
                    numReviews: productData.numReviews || 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );
            return product;
        } catch (error) {
            throw new Error(`Error creating product: ${error.message}`);
        }
    }

    // Get all products with optional filtering
    async getAll(filters = {}, limit = 25, offset = 0) {
        try {
            const queries = [];
            
            // Add status filter (active by default)
            if (filters.status) {
                queries.push(Query.equal('status', filters.status));
            } else {
                queries.push(Query.equal('status', 'active'));
            }

            // Add category filter
            if (filters.category) {
                queries.push(Query.equal('category', filters.category));
            }

            // Add brand filter
            if (filters.brand) {
                queries.push(Query.equal('brand', filters.brand));
            }

            // Add featured filter
            if (filters.featured !== undefined) {
                queries.push(Query.equal('featured', filters.featured));
            }

            // Add price range filter
            if (filters.minPrice) {
                queries.push(Query.greaterThanEqual('price', filters.minPrice));
            }
            if (filters.maxPrice) {
                queries.push(Query.lessThanEqual('price', filters.maxPrice));
            }

            // Add search query
            if (filters.search) {
                queries.push(Query.search('name', filters.search));
            }

            // Add pagination
            queries.push(Query.limit(limit));
            queries.push(Query.offset(offset));

            // Add ordering
            if (filters.orderBy) {
                queries.push(Query.orderDesc(filters.orderBy));
            } else {
                queries.push(Query.orderDesc('createdAt'));
            }

            const products = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                queries
            );
            return products;
        } catch (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }
    }

    // Get a single product by ID
    async getById(productId) {
        try {
            const product = await databases.getDocument(
                this.databaseId,
                this.collectionId,
                productId
            );
            return product;
        } catch (error) {
            throw new Error(`Error fetching product: ${error.message}`);
        }
    }

    // Update a product
    async update(productId, updateData) {
        try {
            const product = await databases.updateDocument(
                this.databaseId,
                this.collectionId,
                productId,
                {
                    ...updateData,
                    updatedAt: new Date().toISOString()
                }
            );
            return product;
        } catch (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    // Delete a product
    async delete(productId) {
        try {
            await databases.deleteDocument(
                this.databaseId,
                this.collectionId,
                productId
            );
            return { success: true, message: 'Product deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }

    // Get featured products
    async getFeatured(limit = 8) {
        try {
            const products = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.equal('featured', true),
                    Query.equal('status', 'active'),
                    Query.limit(limit),
                    Query.orderDesc('createdAt')
                ]
            );
            return products;
        } catch (error) {
            throw new Error(`Error fetching featured products: ${error.message}`);
        }
    }

    // Get products by category
    async getByCategory(category, limit = 25, offset = 0) {
        try {
            const products = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.equal('category', category),
                    Query.equal('status', 'active'),
                    Query.limit(limit),
                    Query.offset(offset),
                    Query.orderDesc('createdAt')
                ]
            );
            return products;
        } catch (error) {
            throw new Error(`Error fetching products by category: ${error.message}`);
        }
    }

    // Search products
    async search(searchTerm, limit = 25, offset = 0) {
        try {
            const products = await databases.listDocuments(
                this.databaseId,
                this.collectionId,
                [
                    Query.search('name', searchTerm),
                    Query.equal('status', 'active'),
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
            return products;
        } catch (error) {
            throw new Error(`Error searching products: ${error.message}`);
        }
    }

    // Update product stock
    async updateStock(productId, quantity) {
        try {
            const product = await this.getById(productId);
            const newStock = product.stock + quantity;
            
            if (newStock < 0) {
                throw new Error('Insufficient stock');
            }

            const updatedProduct = await this.update(productId, {
                stock: newStock
            });
            return updatedProduct;
        } catch (error) {
            throw new Error(`Error updating stock: ${error.message}`);
        }
    }
}

module.exports = Product;
