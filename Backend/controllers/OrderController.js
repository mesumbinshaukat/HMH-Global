const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Create order
exports.createOrder = async (req, res) => {
    try {
        const { paymentMethod, shippingAddress, billingAddress } = req.body;

        // Validation
        if (!paymentMethod) {
            return res.status(400).json({ success: false, message: 'Payment method is required' });
        }

        if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
            return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
        }

        if (!billingAddress || !billingAddress.firstName || !billingAddress.lastName || !billingAddress.address1 || !billingAddress.city || !billingAddress.state || !billingAddress.zipCode || !billingAddress.country) {
            return res.status(400).json({ success: false, message: 'Complete billing address is required' });
        }

        const cart = await Cart.findOne({ user: req.user.userId }).populate({
            path: 'items.product',
            select: 'name sku price salePrice inventory isActive'
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Validate inventory for all items
        for (const item of cart.items) {
            if (item.product.inventory.trackQuantity && item.product.inventory.quantity < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${item.product.name}. Available: ${item.product.inventory.quantity}` 
                });
            }
        }

        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            sku: item.product.sku,
            price: item.price,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity
        }));

        const orderSubtotal = orderItems.reduce((total, item) => total + item.totalPrice, 0);
        const vat = +(orderSubtotal * 0.20).toFixed(2);
        const shipping = orderSubtotal > 50 ? 0 : 5.99;
        const orderTotal = +(orderSubtotal + vat + shipping).toFixed(2);

        const newOrder = new Order({
            user: req.user.userId,
            items: orderItems,
            paymentMethod,
            pricing: {
                subtotal: orderSubtotal,
                tax: vat,
                shipping: shipping,
                total: orderTotal
            },
            shippingAddress,
            billingAddress
        });

        await newOrder.save();

        // Get user details for email
        const user = await User.findById(req.user.userId);

        // Send order confirmation email (non-fatal)
        try {
            const port = Number(process.env.SMTP_PORT || 465);
            const secure = port === 465;
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOSTNAME,
                port,
                secure,
                auth: {
                    user: (process.env.SMTP_USER || '').replace(/'/g, ''),
                    pass: (process.env.SMTP_PASS || '').replace(/'/g, ''),
                },
            });
            await transporter.sendMail({
                from: `HMH Global <${(process.env.SMTP_USER || '').replace(/'/g, '')}>`,
                to: user.email,
                subject: "Order Confirmation - HMH Global",
                html: `
                    <h2>Order Confirmation</h2>
                    <p>Dear ${user.name},</p>
                    <p>Thank you for your order! Your order has been placed successfully.</p>
                    <p><strong>Order Number:</strong> ${newOrder.orderNumber}</p>
                    <p><strong>Subtotal:</strong> £${orderSubtotal.toFixed(2)}</p>
                    <p><strong>VAT (20%):</strong> £${vat.toFixed(2)}</p>
                    <p><strong>Shipping:</strong> ${shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}`}</p>
                    <p><strong>Total Amount:</strong> £${orderTotal.toFixed(2)}</p>
                    <p>You will receive another email when your order is shipped.</p>
                    <p>Thank you for shopping with HMH Global!</p>
                `,
            });
        } catch (emailError) {
            console.warn('Failed to send order confirmation email (non-fatal):', emailError.message);
        }

        // Clear cart after placing the order
        cart.clearCart();
        await cart.save();

        res.status(201).json({ success: true, order: newOrder, message: 'Order placed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId }).sort('-createdAt');
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user.userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findOne({ _id: req.params.id, user: req.user.userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (['shipped', 'delivered'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
        }

        order.status = 'cancelled';
        order.cancellationReason = reason;
        await order.save();

        res.status(200).json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.status(200).json({ success: true, message: 'Order status updated', order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Get all orders with pagination and filtering
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        // Only allow admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const {
            page = 1,
            limit = 12,
            status,
            search
        } = req.query;
        const filter = {};
        if (status) filter.status = status;
        // Search by order number or user email
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
            // Find users by email
            const users = await User.find({ email: { $regex: search, $options: 'i' } }).select('_id');
            if (users.length > 0) {
                filter.$or.push({ user: { $in: users.map(u => u._id) } });
            }
        }
        const skip = (page - 1) * limit;
        const orders = await Order.find(filter)
            .populate('user', 'email name')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));
        const total = await Order.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk update order status (admin)
exports.bulkUpdateOrderStatus = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { orderIds, status } = req.body;
        if (!Array.isArray(orderIds) || !status) {
            return res.status(400).json({ success: false, message: 'orderIds (array) and status are required' });
        }
        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status } }
        );
        res.status(200).json({ success: true, message: `Updated ${result.nModified || result.modifiedCount} orders` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Bulk delete orders (admin)
exports.bulkDeleteOrders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { orderIds } = req.body;
        if (!Array.isArray(orderIds)) {
            return res.status(400).json({ success: false, message: 'orderIds (array) is required' });
        }
        const result = await Order.deleteMany({ _id: { $in: orderIds } });
        res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} orders` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Export orders (admin, CSV/Excel)
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
exports.exportOrders = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const { format = 'csv', status, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
            const users = await User.find({ email: { $regex: search, $options: 'i' } }).select('_id');
            if (users.length > 0) {
                filter.$or.push({ user: { $in: users.map(u => u._id) } });
            }
        }
        const orders = await Order.find(filter).populate('user', 'email name').sort({ createdAt: -1 });
        const plainOrders = orders.map(o => ({
            orderNumber: o.orderNumber,
            user: o.user?.email || o.user,
            status: o.status,
            total: o.pricing?.total || o.total,
            createdAt: o.createdAt,
            items: o.items.length
        }));
        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Orders');
            worksheet.columns = [
                { header: 'Order #', key: 'orderNumber' },
                { header: 'User', key: 'user' },
                { header: 'Status', key: 'status' },
                { header: 'Total', key: 'total' },
                { header: 'Created At', key: 'createdAt' },
                { header: 'Items', key: 'items' }
            ];
            worksheet.addRows(plainOrders);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        } else {
            const parser = new Parser();
            const csv = parser.parse(plainOrders);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
            res.send(csv);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

