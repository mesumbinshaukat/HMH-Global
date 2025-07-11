const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOSTNAME,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER.replace(/'/g, ""),
        pass: process.env.SMTP_PASS.replace(/'/g, "")
    }
});

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

        const orderTotal = orderItems.reduce((total, item) => total + item.totalPrice, 0);

        const newOrder = new Order({
            user: req.user.userId,
            items: orderItems,
            paymentMethod,
            pricing: {
                subtotal: orderTotal,
                total: orderTotal // Add tax, shipping, etc. as needed
            },
            shippingAddress,
            billingAddress
        });

        await newOrder.save();

        // Get user details for email
        const user = await User.findById(req.user.userId);

        // Send order confirmation email
        try {
            await transporter.sendMail({
                from: `"HMH Global" <${process.env.SMTP_USER.replace(/'/g, "")}/>`,
                to: user.email,
                subject: "Order Confirmation - HMH Global",
                html: `
                    <h2>Order Confirmation</h2>
                    <p>Dear ${user.name},</p>
                    <p>Thank you for your order! Your order has been placed successfully.</p>
                    <p><strong>Order Number:</strong> ${newOrder.orderNumber}</p>
                    <p><strong>Total Amount:</strong> $${orderTotal.toFixed(2)}</p>
                    <p>You will receive another email when your order is shipped.</p>
                    <p>Thank you for shopping with HMH Global!</p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
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

