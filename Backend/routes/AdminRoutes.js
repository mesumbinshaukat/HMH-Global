const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const AdminController = require('../controllers/AdminController');
const multer = require('multer');
const path = require('path');

// Configure multer for CSV uploads
const csvUpload = multer({
  dest: 'uploads/temp/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All admin routes require authentication and admin role
router.use(authMiddleware, roleMiddleware('admin'));

// Dashboard stats and metrics
router.get('/stats', AdminController.getStats);
router.get('/metrics', AdminController.getMetrics);

// Trigger web scraper for northwest-cosmetics.com
router.post('/scrape-northwest', AdminController.scrapeNorthwestCosmetics);

// SSE progress endpoint (now secured for admin)
router.get('/scrape-progress', AdminController.scrapeProgressSSE);

// Order management
router.get('/orders', AdminController.getAllOrders);
router.put('/orders/:orderId/status', AdminController.updateOrderStatus);
router.post('/orders/bulk-update', AdminController.bulkUpdateOrderStatus);
router.post('/orders/bulk-delete', AdminController.bulkDeleteOrders);
router.get('/orders/export', AdminController.exportOrders);
router.get('/orders/:orderId/invoice', AdminController.generateInvoice);

// Product management (CRUD)
router.post('/products', AdminController.uploadMiddleware.array('images', 5), AdminController.createProduct);
router.put('/products/:productId', AdminController.uploadMiddleware.array('images', 5), AdminController.updateProduct);
router.delete('/products/:productId', AdminController.deleteProduct);
router.post('/products/bulk-import', csvUpload.single('csv'), AdminController.bulkImportProducts);
router.get('/products/export', AdminController.exportProducts);

// User management
router.get('/users', AdminController.getAllUsers);
router.put('/users/:userId/role', AdminController.toggleUserRole);
router.post('/users/:userId/impersonate', AdminController.impersonateUser);

module.exports = router; 