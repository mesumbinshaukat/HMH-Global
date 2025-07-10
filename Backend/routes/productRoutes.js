const express = require('express');
const router = express.Router();
const {
    createProduct,
    getAllProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getFeaturedProducts,
    searchProducts,
    updateInventory,
    getRelatedProducts
} = require('../controllers/ProductController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);

// Admin only routes
router.post('/', authMiddleware, roleMiddleware('admin'), createProduct);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteProduct);
router.patch('/:id/inventory', authMiddleware, roleMiddleware('admin'), updateInventory);

module.exports = router;
