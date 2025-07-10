const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.lastUpdated = new Date();
    next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, price) {
    const existingItemIndex = this.items.findIndex(item => 
        item.product.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += quantity;
        this.items[existingItemIndex].price = price; // Update price in case it changed
    } else {
        this.items.push({
            product: productId,
            quantity,
            price
        });
    }
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item => 
        item.product.toString() !== productId.toString()
    );
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
    const item = this.items.find(item => 
        item.product.toString() === productId.toString()
    );
    
    if (item) {
        if (quantity <= 0) {
            this.removeItem(productId);
        } else {
            item.quantity = quantity;
        }
    }
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
};

module.exports = mongoose.model('Cart', cartSchema);
