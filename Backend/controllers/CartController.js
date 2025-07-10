const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Create or get existing cart for the user
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
        if (!cart) {
            cart = new Cart({ user: req.user.userId });
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

        // Validation
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        if (quantity <= 0 || !Number.isInteger(quantity)) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
        }

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (!product.isActive) {
            return res.status(400).json({ success: false, message: 'Product is not available' });
        }

        // Check inventory
        if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Insufficient stock available' });
        }

        let cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            cart = new Cart({ user: req.user.userId });
        }

        // Use effective price (sale price if available, otherwise regular price)
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
        const cart = await Cart.findOne({ user: req.user.userId });

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
        const cart = await Cart.findOne({ user: req.user.userId });

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
        const cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        cart.clearCart();
        await cart.save();
        res.status(200).json({ success: true, message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
