const Cart = require('../models/Cart');
const Product = require('../models/Product');
const crypto = require('crypto');

// Helper to get or set sessionId cookie
function getOrSetSessionId(req, res) {
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
        sessionId = crypto.randomBytes(16).toString('hex');
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax',
        });
    }
    return sessionId;
}

// Get cart (user or guest)
exports.getCart = async (req, res) => {
    try {
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
        } else {
            const sessionId = getOrSetSessionId(req, res);
            cart = await Cart.findOne({ sessionId }).populate('items.product');
        }
        if (!cart) {
            cart = new Cart(req.user ? { user: req.user.userId } : { sessionId: getOrSetSessionId(req, res) });
            await cart.save();
        }
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Add item to cart
exports.addItemToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        if (quantity <= 0 || !Number.isInteger(quantity)) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (!product.isActive) {
            return res.status(400).json({ success: false, message: 'Product is not available' });
        }
        if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock available' });
        }
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user.userId });
            if (!cart) cart = new Cart({ user: req.user.userId });
        } else {
            const sessionId = getOrSetSessionId(req, res);
            cart = await Cart.findOne({ sessionId });
            if (!cart) cart = new Cart({ sessionId });
        }
        const effectivePrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
        cart.addItem(productId, quantity, effectivePrice);
        await cart.save();
        await cart.populate('items.product');
        res.status(200).json({ success: true, cart, message: 'Item added to cart successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Update item quantity
exports.updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user.userId });
        } else {
            const sessionId = getOrSetSessionId(req, res);
            cart = await Cart.findOne({ sessionId });
        }
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        cart.updateItemQuantity(productId, quantity);
        await cart.save();
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user.userId });
        } else {
            const sessionId = getOrSetSessionId(req, res);
            cart = await Cart.findOne({ sessionId });
        }
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        cart.removeItem(productId);
        await cart.save();
        res.status(200).json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        let cart;
        if (req.user) {
            cart = await Cart.findOne({ user: req.user.userId });
        } else {
            const sessionId = getOrSetSessionId(req, res);
            cart = await Cart.findOne({ sessionId });
        }
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });
        cart.clearCart();
        await cart.save();
        res.status(200).json({ success: true, message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Merge guest cart into user cart on login
exports.mergeCart = async (req, res) => {
    try {
        const { sessionId } = req.cookies;
        const userId = req.user?.userId || req.body.userId;
        if (!sessionId || !userId) {
            return res.status(400).json({ success: false, message: 'Missing sessionId or userId' });
        }
        const guestCart = await Cart.findOne({ sessionId });
        let userCart = await Cart.findOne({ user: userId });
        if (!userCart) userCart = new Cart({ user: userId });
        if (guestCart) {
            // Merge items (add quantities if same product)
            for (const item of guestCart.items) {
                const existing = userCart.items.find(i => i.product.toString() === item.product.toString());
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    userCart.items.push(item);
                }
            }
            await userCart.save();
            await Cart.deleteOne({ sessionId });
        }
        res.status(200).json({ success: true, cart: userCart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
