const express = require('express');
const router = express.Router();
const {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    markHelpful
} = require('../controllers/ReviewController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.use(authMiddleware);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.patch('/:id/helpful', markHelpful);

module.exports = router;
