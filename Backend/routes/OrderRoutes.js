const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrdersAdmin
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
router.get('/', authMiddleware, roleMiddleware('admin'), getAllOrdersAdmin); // Admin: get all orders with pagination/filtering
router.post('/bulk-status', authMiddleware, roleMiddleware('admin'), require('../controllers/OrderController').bulkUpdateOrderStatus);
router.post('/bulk-delete', authMiddleware, roleMiddleware('admin'), require('../controllers/OrderController').bulkDeleteOrders);
router.get('/export', authMiddleware, roleMiddleware('admin'), require('../controllers/OrderController').exportOrders);

module.exports = router;
