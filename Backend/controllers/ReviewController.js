const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Create transporter lazily to avoid crashing the app when SMTP env is missing/invalid
function createTransporterSafe() {
    try {
        const host = process.env.SMTP_HOSTNAME;
        const portStr = process.env.SMTP_PORT;
        const user = process.env.SMTP_USER ? process.env.SMTP_USER.replace(/'/g, '') : undefined;
        const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/'/g, '') : undefined;

        if (!host || !portStr || !user || !pass) {
            return null; // Missing config, skip email silently
        }
        const port = Number(portStr);
        const secure = port === 465; // only true for 465

        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass }
        });
    } catch (e) {
        // Never throw from here; just disable emails
        return null;
    }
}

// Create review
exports.createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment, orderId } = req.body;

        // Validation
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        if (!title || title.length > 100) {
            return res.status(400).json({ success: false, message: 'Review title must not exceed 100 characters' });
        }

        if (!comment || comment.length > 1000) {
            return res.status(400).json({ success: false, message: 'Review comment must not exceed 1000 characters' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const newReview = new Review({
            user: req.user.userId,
            product: productId,
            order: orderId,
            rating,
            title,
            comment
        });

        await newReview.save();

        // Send email notification (non-fatal)
        try {
            const tx = createTransporterSafe();
            if (tx) {
                const userDoc = await User.findById(req.user.userId);
                const fromAddr = process.env.SMTP_USER ? process.env.SMTP_USER.replace(/'/g, '') : '';
                await tx.sendMail({
                    from: `"HMH Global" <${fromAddr}>`,
                    to: userDoc?.email,
                    subject: 'Thank you for your review!',
                    html: `<p>Dear ${userDoc?.name || 'Customer'}, thank you for reviewing ${product.name}!</p>`
                });
            }
        } catch (emailError) {
            console.error('Failed to send review confirmation email:', emailError);
        }

        res.status(201).json({ success: true, review: newReview, message: 'Review created successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
        }
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId, status: 'approved' })
            .populate('user', 'name')
            .sort('-createdAt');

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const updatedReview = await Review.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            req.body,
            { new: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, review: updatedReview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const deletedReview = await Review.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!deletedReview) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        review.markHelpful(req.user.userId);
        await review.save();

        res.status(200).json({ success: true, message: 'Review marked as helpful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
