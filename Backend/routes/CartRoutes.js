const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart,
    mergeCart
} = require('../controllers/CartController');

// Public routes (hybrid: guest via sessionId cookie, user via JWT)
router.get('/', getCart);
router.post('/add', addItemToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeItemFromCart);
router.delete('/clear', clearCart);

// Merge guest cart into user cart on login
router.post('/merge', mergeCart);

module.exports = router;
