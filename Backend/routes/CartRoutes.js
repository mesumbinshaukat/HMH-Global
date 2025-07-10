const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
    clearCart
} = require('../controllers/CartController');
const authMiddleware = require('../middleware/auth');

// All cart routes require authentication
router.use(authMiddleware);

router.get('/', getCart);
router.post('/add', addItemToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeItemFromCart);
router.delete('/clear', clearCart);

module.exports = router;
