const express = require('express');
const router = express.Router();
const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/CategoryController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin only routes
router.post('/', authMiddleware, roleMiddleware('admin'), createCategory);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateCategory);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteCategory);

module.exports = router;
