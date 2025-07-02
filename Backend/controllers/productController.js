const Product = require('../models/Product');
const { handleError } = require('../utils/errorHandler');
const { validateProduct } = require('../utils/validation');

const productModel = new Product();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            category,
            brand,
            featured,
            minPrice,
            maxPrice,
            search,
            orderBy,
            status
        } = req.query;

        const offset = (page - 1) * limit;
        const filters = {};

        // Build filters object
        if (category) filters.category = category;
        if (brand) filters.brand = brand;
        if (featured !== undefined) filters.featured = featured === 'true';
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (search) filters.search = search;
        if (orderBy) filters.orderBy = orderBy;
        if (status) filters.status = status;

        const products = await productModel.getAll(filters, parseInt(limit), parseInt(offset));

        res.status(200).json({
            success: true,
            data: products.documents,
            total: products.total,
            page: parseInt(page),
            pages: Math.ceil(products.total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
    try {
        const product = await productModel.getById(req.params.id);
        
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        // Validate product data
        const validationError = validateProduct(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const product = await productModel.create(req.body);
        
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await productModel.update(req.params.id, req.body);
        
        res.status(200).json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        await productModel.delete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const products = await productModel.getFeatured(parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: products.documents,
            total: products.total
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const offset = (page - 1) * limit;
        
        const products = await productModel.getByCategory(
            req.params.category,
            parseInt(limit),
            parseInt(offset)
        );
        
        res.status(200).json({
            success: true,
            data: products.documents,
            total: products.total,
            page: parseInt(page),
            pages: Math.ceil(products.total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Search products
// @route   GET /api/products/search/:searchTerm
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const offset = (page - 1) * limit;
        
        const products = await productModel.search(
            req.params.searchTerm,
            parseInt(limit),
            parseInt(offset)
        );
        
        res.status(200).json({
            success: true,
            data: products.documents,
            total: products.total,
            page: parseInt(page),
            pages: Math.ceil(products.total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
const updateProductStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: 'Quantity is required'
            });
        }

        const product = await productModel.updateStock(req.params.id, quantity);
        
        res.status(200).json({
            success: true,
            data: product,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
    getProductsByCategory,
    searchProducts,
    updateProductStock
};
