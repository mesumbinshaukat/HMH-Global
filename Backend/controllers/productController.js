const Product = require('../models/Product');
const Category = require('../models/Category');

// Create product
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, sku, category, inventory } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }

        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({ success: false, message: 'Product name must be between 2 and 100 characters' });
        }

        if (!description || description.trim() === '') {
            return res.status(400).json({ success: false, message: 'Product description is required' });
        }

        if (!price || price <= 0) {
            return res.status(400).json({ success: false, message: 'Valid price is required' });
        }

        if (!sku || sku.trim() === '') {
            return res.status(400).json({ success: false, message: 'SKU is required' });
        }

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku: sku.trim().toUpperCase() });
        if (existingProduct) {
            return res.status(409).json({ success: false, message: 'Product with this SKU already exists' });
        }

        // Validate category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ success: false, message: 'Invalid category' });
        }

        const newProduct = new Product(req.body);
        await newProduct.save();
        await newProduct.populate('category subcategory');
        res.status(201).json({ success: true, data: newProduct, message: 'Product created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Product with this SKU already exists' });
        }
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Get all products with filtering, sorting, and pagination
exports.getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            subcategory,
            brand,
            minPrice,
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            isActive = true,
            isFeatured
        } = req.query;

        // Build filter object
        const filter = {};
        
        // Only add isActive filter if explicitly set to false, otherwise show active products by default
        if (isActive === 'false') {
            filter.isActive = false;
        } else {
            filter.isActive = true;
        }
        
        if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
        if (category) filter.category = category;
        if (subcategory) filter.subcategory = subcategory;
        if (brand) filter.brand = new RegExp(brand, 'i');
        
        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Search functionality
        if (search) {
            filter.$text = { $search: search };
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const products = await Product.find(filter)
            .populate('category subcategory', 'name slug')
            .sort(sortObj)
            .limit(limit * 1)
            .skip(skip)
            .select('-__v');

        // Get total count for pagination
        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                data: products,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category subcategory', 'name slug description');
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment view count
        product.views += 1;
        await product.save();

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product by slug
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug, isActive: true })
            .populate('category subcategory', 'name slug description');
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment view count
        product.views += 1;
        await product.save();

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        ).populate('category subcategory', 'name slug');
        
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const skip = (page - 1) * limit;
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const products = await Product.find({ category: categoryId, isActive: true })
            .populate('category', 'name slug')
            .sort(sortObj)
            .limit(limit * 1)
            .skip(skip);

        const total = await Product.countDocuments({ category: categoryId, isActive: true });

        res.status(200).json({
            success: true,
            data: {
                data: products,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;

        const products = await Product.find({ isFeatured: true, isActive: true })
            .populate('category', 'name slug')
            .sort({ createdAt: -1 })
            .limit(limit * 1);

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search products
exports.searchProducts = async (req, res) => {
    try {
        const { q, page = 1, limit = 12 } = req.query;
        
        if (!q) {
            return res.status(400).json({ success: false, message: 'Search query is required' });
        }

        const skip = (page - 1) * limit;

        const products = await Product.find({
            $text: { $search: q },
            isActive: true
        })
        .populate('category', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit * 1)
        .skip(skip);

        const total = await Product.countDocuments({
            $text: { $search: q },
            isActive: true
        });

        res.status(200).json({
            success: true,
            data: {
                data: products,
                query: q,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update product inventory
exports.updateInventory = async (req, res) => {
    try {
        const { quantity, operation = 'set' } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (operation === 'add') {
            product.inventory.quantity += quantity;
        } else if (operation === 'subtract') {
            product.inventory.quantity = Math.max(0, product.inventory.quantity - quantity);
        } else {
            product.inventory.quantity = quantity;
        }

        await product.save();

        res.status(200).json({ 
            success: true, 
            message: 'Inventory updated successfully',
            inventory: product.inventory
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get related products
exports.getRelatedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            isActive: true
        })
        .populate('category', 'name slug')
        .limit(4)
        .sort({ 'ratings.average': -1 });

        res.status(200).json({ success: true, products: relatedProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
