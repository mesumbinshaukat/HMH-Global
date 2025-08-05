const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('json2csv');
const ExcelJS = require('exceljs');
const { scraperEmitter } = require('../scripts/scrapeNorthwestCosmetics');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Enhanced metrics endpoint
exports.getMetrics = async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;
        
        // Calculate date ranges
        const endDate = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }
        
        // Get orders by status
        const ordersByStatus = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } }
        ]);
        
        // Get daily revenue data
        const dailyRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$pricing.total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        // Get user registration data
        const userRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        // Get top selling products
        const topProducts = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    quantity: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $sort: { quantity: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({
            success: true,
            data: {
                ordersByStatus,
                dailyRevenue,
                userRegistrations,
                topProducts,
                timeframe
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch metrics', error: error.message });
    }
};

// Get all orders for admin
exports.getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 12, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            query.status = status;
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const orders = await Order.find(query)
            .populate('user', 'email firstName lastName')
            .populate('items.product', 'name images')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                data: orders,
                pagination: {
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate('user', 'email firstName lastName');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
    }
};

// Bulk update order status
exports.bulkUpdateOrderStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        
        await Order.updateMany(
            { _id: { $in: orderIds } },
            { status }
        );
        
        res.json({ success: true, message: `Updated ${orderIds.length} orders` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to bulk update orders', error: error.message });
    }
};

// Bulk delete orders
exports.bulkDeleteOrders = async (req, res) => {
    try {
        const { orderIds } = req.body;
        
        await Order.deleteMany({ _id: { $in: orderIds } });
        
        res.json({ success: true, message: `Deleted ${orderIds.length} orders` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to bulk delete orders', error: error.message });
    }
};

// Export orders
exports.exportOrders = async (req, res) => {
    try {
        const { format = 'csv', status, search } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } }
            ];
        }
        
        const orders = await Order.find(query)
            .populate('user', 'email firstName lastName')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 });
        
        const exportData = orders.map(order => ({
            orderNumber: order.orderNumber,
            userEmail: order.user?.email || '',
            status: order.status,
            total: order.pricing?.total || 0,
            itemCount: order.items.length,
            createdAt: order.createdAt,
            shippingAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
            paymentMethod: order.paymentMethod
        }));
        
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Orders');
            
            worksheet.columns = [
                { header: 'Order Number', key: 'orderNumber', width: 15 },
                { header: 'User Email', key: 'userEmail', width: 25 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Total', key: 'total', width: 10 },
                { header: 'Item Count', key: 'itemCount', width: 12 },
                { header: 'Created At', key: 'createdAt', width: 20 },
                { header: 'Shipping Address', key: 'shippingAddress', width: 40 },
                { header: 'Payment Method', key: 'paymentMethod', width: 15 }
            ];
            
            worksheet.addRows(exportData);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
            
            await workbook.xlsx.write(res);
        } else {
            const parser = new csv.Parser();
            const csvData = parser.parse(exportData);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
            res.send(csvData);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to export orders', error: error.message });
    }
};

// CRUD Operations for Products
exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;
        const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
        
        const product = new Product({
            ...productData,
            images,
            price: parseFloat(productData.price),
            salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
            stockQuantity: parseInt(productData.stockQuantity),
            isFeatured: productData.isFeatured === 'true',
            isActive: productData.isActive === 'true'
        });
        
        await product.save();
        await product.populate('category');
        
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const productData = req.body;
        
        const updateData = {
            ...productData,
            price: parseFloat(productData.price),
            salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
            stockQuantity: parseInt(productData.stockQuantity),
            isFeatured: productData.isFeatured === 'true',
            isActive: productData.isActive === 'true'
        };
        
        // Handle new images
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => `/uploads/products/${file.filename}`);
        }
        
        const product = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        ).populate('category');
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Delete associated images
        product.images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
    }
};

// Bulk CSV import for products
exports.bulkImportProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'CSV file is required' });
        }
        
        const csvData = fs.readFileSync(req.file.path, 'utf8');
        const records = csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true
        });
        
        const results = {
            success: 0,
            errors: []
        };
        
        for (const [index, record] of records.entries()) {
            try {
                // Find or create category
                let category = null;
                if (record.category) {
                    category = await Category.findOne({ name: record.category });
                    if (!category) {
                        category = await Category.create({ name: record.category });
                    }
                }
                
                const productData = {
                    name: record.name,
                    description: record.description || '',
                    price: parseFloat(record.price) || 0,
                    salePrice: record.salePrice ? parseFloat(record.salePrice) : null,
                    category: category?._id,
                    brand: record.brand || '',
                    stockQuantity: parseInt(record.stockQuantity) || 0,
                    isFeatured: record.isFeatured === 'true' || record.isFeatured === '1',
                    isActive: record.isActive !== 'false' && record.isActive !== '0'
                };
                
                await Product.create(productData);
                results.success++;
            } catch (error) {
                results.errors.push(`Row ${index + 2}: ${error.message}`);
            }
        }
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
            success: true,
            message: `Import completed. ${results.success} products imported successfully.`,
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to import products', error: error.message });
    }
};

// Export products
exports.exportProducts = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;
        
        const products = await Product.find()
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        
        const exportData = products.map(product => ({
            name: product.name,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice || '',
            category: product.category?.name || '',
            brand: product.brand,
            stockQuantity: product.stockQuantity,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            createdAt: product.createdAt
        }));
        
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Products');
            
            worksheet.columns = [
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Description', key: 'description', width: 40 },
                { header: 'Price', key: 'price', width: 10 },
                { header: 'Sale Price', key: 'salePrice', width: 10 },
                { header: 'Category', key: 'category', width: 15 },
                { header: 'Brand', key: 'brand', width: 15 },
                { header: 'Stock Quantity', key: 'stockQuantity', width: 15 },
                { header: 'Featured', key: 'isFeatured', width: 10 },
                { header: 'Active', key: 'isActive', width: 10 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];
            
            worksheet.addRows(exportData);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
            
            await workbook.xlsx.write(res);
        } else {
            const parser = new csv.Parser();
            const csvData = parser.parse(exportData);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
            res.send(csvData);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to export products', error: error.message });
    }
};

// Get all users with search and pagination
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 12, search, role } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }
        
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await User.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                data: users,
                pagination: {
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

// Toggle user role
exports.toggleUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user role', error: error.message });
    }
};

// User impersonation (generate token for specific user)
exports.impersonateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const jwt = require('jsonwebtoken');
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role,
                impersonatedBy: req.user.userId // Track who is impersonating
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Shorter expiry for impersonation
        );
        
        res.json({ 
            success: true, 
            data: { 
                token, 
                user,
                message: 'Impersonation token generated. Use this token to act as the user.' 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to impersonate user', error: error.message });
    }
};

// Generate PDF invoice for order
exports.generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await Order.findById(orderId)
            .populate('user', 'email firstName lastName')
            .populate('items.product', 'name');
            
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Generate PDF using a simple HTML template
        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-details { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .total { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>HMH Global</h1>
                    <h2>Invoice</h2>
                </div>
                
                <div class="invoice-details">
                    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Customer:</strong> ${order.user?.firstName} ${order.user?.lastName} (${order.user?.email})</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.product?.name || item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="total">Subtotal:</td>
                            <td class="total">$${(order.pricing?.subtotal || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="total">Tax:</td>
                            <td class="total">$${(order.pricing?.tax || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="total">Shipping:</td>
                            <td class="total">$${(order.pricing?.shipping || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="total">Total:</td>
                            <td class="total">$${(order.pricing?.total || 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `;
        
        // For now, return HTML. In production, you'd convert this to PDF
        res.setHeader('Content-Type', 'text/html');
        res.send(invoiceHtml);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate invoice', error: error.message });
    }
};

// Middleware export for multer
exports.uploadMiddleware = upload;
