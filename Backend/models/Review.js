const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    images: [{
        url: String,
        alt: String
    }],
    helpful: {
        count: {
            type: Number,
            default: 0
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    verified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminResponse: {
        message: String,
        respondedAt: Date,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, {
    timestamps: true
});

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Static method to calculate average rating for a product
reviewSchema.statics.calculateProductRating = async function(productId) {
    const stats = await this.aggregate([
        {
            $match: { 
                product: new mongoose.Types.ObjectId(productId),
                status: 'approved'
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        const Product = mongoose.model('Product');
        await Product.findByIdAndUpdate(productId, {
            'ratings.average': Math.round(stats[0].averageRating * 10) / 10,
            'ratings.count': stats[0].totalReviews
        });
    }
};

// Method to mark review as helpful
reviewSchema.methods.markHelpful = function(userId) {
    if (!this.helpful.users.includes(userId)) {
        this.helpful.users.push(userId);
        this.helpful.count = this.helpful.users.length;
    }
};

// Method to unmark review as helpful
reviewSchema.methods.unmarkHelpful = function(userId) {
    this.helpful.users = this.helpful.users.filter(id => id.toString() !== userId.toString());
    this.helpful.count = this.helpful.users.length;
};

// Post-save middleware to update product rating
reviewSchema.post('save', async function() {
    if (this.status === 'approved') {
        await this.constructor.calculateProductRating(this.product);
    }
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function() {
    await this.constructor.calculateProductRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
