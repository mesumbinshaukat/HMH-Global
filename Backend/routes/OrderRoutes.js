const express = require('express');
const router = express.Router();
const {
    createOrder,
    createGuestOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrdersAdmin
} = require('../controllers/OrderController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public guest checkout route (no authentication required)
router.post('/guest', createGuestOrder);

// All other routes require authentication
router.use(authMiddleware);

// Admin-specific routes (put these BEFORE parameterized routes)
router.get('/admin/all', roleMiddleware('admin'), getAllOrdersAdmin);
router.post('/admin/bulk-status', roleMiddleware('admin'), require('../controllers/OrderController').bulkUpdateOrderStatus);
router.post('/admin/bulk-delete', roleMiddleware('admin'), require('../controllers/OrderController').bulkDeleteOrders);
router.get('/admin/export', roleMiddleware('admin'), require('../controllers/OrderController').exportOrders);

// Customer routes
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// Admin routes with parameters
router.patch('/:id/status', roleMiddleware('admin'), updateOrderStatus);

module.exports = router;
