const express = require('express');
const productRoutes = require('./productRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'HMH Global API is running!',
        timestamp: new Date().toISOString()
    });
});

// API routes
router.use('/products', productRoutes);

module.exports = router;
