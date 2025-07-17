const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { spawn } = require('child_process');
const path = require('path');
const { scraperEmitter } = require('../scripts/scrapeNorthwestCosmetics');

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
        console.log('[AdminController] Starting Northwest Cosmetics scraper...');
        
        // Path to the scraper script
        const scriptPath = path.join(__dirname, '../scripts/scrapeNorthwestCosmetics.js');
        
        // Check if script exists
        if (!require('fs').existsSync(scriptPath)) {
            return res.status(500).json({ 
                success: false, 
                message: 'Scraper script not found',
                path: scriptPath
            });
        }
        
        // Spawn a child process to run the scraper
        const scraper = spawn('node', [scriptPath], { 
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: true 
        });
        
        // Log output for debugging
        scraper.stdout.on('data', (data) => {
            console.log(`[Scraper] ${data.toString()}`);
        });
        
        scraper.stderr.on('data', (data) => {
            console.error(`[Scraper Error] ${data.toString()}`);
        });
        
        scraper.on('close', (code) => {
            console.log(`[Scraper] Process exited with code ${code}`);
        });
        
        scraper.unref();
        
        res.json({ 
            success: true, 
            message: 'Northwest Cosmetics scraper started successfully. Check server logs for progress.',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[AdminController] Error starting scraper:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to start scraper', 
            error: error.message 
        });
    }
};

// SSE endpoint for scraper progress
exports.scrapeProgressSSE = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
        let safeData = data;
        if (typeof data === 'undefined' || data === null) {
            safeData = { error: 'No data' };
        }
        try {
            const jsonData = JSON.stringify(safeData);
            res.write(`event: ${event}\n`);
            res.write(`data: ${jsonData}\n\n`);
        } catch (err) {
            console.error('[SSE] Failed to stringify data:', err);
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify({ error: 'Data serialization failed' })}\n\n`);
        }
    };

    // Handlers
    const onStart = (data) => sendEvent('start', data);
    const onProgress = (data) => sendEvent('progress', data);
    const onError = (data) => sendEvent('error', data);
    const onFinish = (data) => sendEvent('finish', data);

    scraperEmitter.on('start', onStart);
    scraperEmitter.on('progress', onProgress);
    scraperEmitter.on('error', onError);
    scraperEmitter.on('finish', onFinish);

    // Clean up listeners on client disconnect
    req.on('close', () => {
        scraperEmitter.off('start', onStart);
        scraperEmitter.off('progress', onProgress);
        scraperEmitter.off('error', onError);
        scraperEmitter.off('finish', onFinish);
        res.end();
    });
};
