const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        min: 0
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    brand: {
        type: String,
        trim: true
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    inventory: {
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        trackQuantity: {
            type: Boolean,
            default: true
        }
    },
    specifications: [{
        name: String,
        value: String
    }],
    tags: [String],
    weight: {
        type: Number, // in grams
        min: 0
    },
    dimensions: {
        length: Number, // in cm
        width: Number,
        height: Number
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    views: {
        type: Number,
        default: 0
    },
    soldCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.salePrice && this.salePrice < this.price) {
        return Math.round(((this.price - this.salePrice) / this.price) * 100);
    }
    return 0;
});

// Virtual for effective price
productSchema.virtual('effectivePrice').get(function() {
    return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (!this.inventory.trackQuantity) return 'in-stock';
    if (this.inventory.quantity === 0) return 'out-of-stock';
    if (this.inventory.quantity <= this.inventory.lowStockThreshold) return 'low-stock';
    return 'in-stock';
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });

module.exports = mongoose.model('Product', productSchema);
