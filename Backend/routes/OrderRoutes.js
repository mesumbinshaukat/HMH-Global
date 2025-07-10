const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus
} = require('../controllers/OrderController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Customer routes
router.use(authMiddleware);
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// Admin routes
router.patch('/:id/status', roleMiddleware('admin'), updateOrderStatus);

module.exports = router;
