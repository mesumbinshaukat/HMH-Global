const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
});

const shippingAddressSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    address1: {
        type: String,
        required: true,
        trim: true
    },
    address2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    zipCode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit-card', 'paypal', 'stripe', 'bank-transfer', 'cash-on-delivery'],
        required: true
    },
    paymentId: {
        type: String // Payment gateway transaction ID
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        shipping: {
            type: Number,
            default: 0,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    billingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    shippingMethod: {
        type: String,
        default: 'standard'
    },
    trackingNumber: {
        type: String
    },
    estimatedDelivery: {
        type: Date
    },
    actualDelivery: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    refundAmount: {
        type: Number,
        min: 0
    },
    refundReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to generate order number
orderSchema.pre('validate', async function(next) {
    if (this.isNew && !this.orderNumber) {
        try {
            const count = await mongoose.model('Order').countDocuments();
            this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

// Index for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Static method to get order statuses
orderSchema.statics.getStatuses = function() {
    return ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
};

// Static method to get payment statuses
orderSchema.statics.getPaymentStatuses = function() {
    return ['pending', 'paid', 'failed', 'refunded'];
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
    this.pricing.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
    this.pricing.total = this.pricing.subtotal + this.pricing.tax + this.pricing.shipping - this.pricing.discount;
};

module.exports = mongoose.model('Order', orderSchema);
