const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const AdminController = require('../controllers/AdminController');

// All admin routes require authentication and admin role
router.use(authMiddleware, roleMiddleware('admin'));

// Dashboard stats
router.get('/stats', AdminController.getStats);

// Trigger web scraper for northwest-cosmetics.com
router.post('/scrape-northwest', AdminController.scrapeNorthwestCosmetics);

module.exports = router; 