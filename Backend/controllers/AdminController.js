const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { spawn } = require('child_process');
const path = require('path');

// Dashboard stats
exports.getStats = async (req, res) => {
    try {
        const users = await User.countDocuments();
        const products = await Product.countDocuments();
        const orders = await Order.countDocuments();
        const revenueAgg = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$pricing.total" } } }
        ]);
        const revenue = revenueAgg[0]?.total || 0;
        res.json({ success: true, data: { users, products, orders, revenue } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    }
};

// Trigger web scraper for northwest-cosmetics.com
exports.scrapeNorthwestCosmetics = async (req, res) => {
    try {
        // Path to the scraper script
        const scriptPath = path.join(__dirname, '../scripts/scrapeNorthwestCosmetics.js');
        // Spawn a child process to run the scraper
        const scraper = spawn('node', [scriptPath], { stdio: 'ignore', detached: true });
        scraper.unref();
        res.json({ success: true, message: 'Scraper started' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to start scraper', error: error.message });
    }
}; 