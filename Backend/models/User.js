const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true, // Enforce lowercase at schema level
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    expireAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        index: { expireAfterSeconds: 0 }
    },
    profilePicture: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure email is always stored in lowercase
userSchema.pre('save', function(next) {
    if (this.isModified('email') && this.email) {
        this.email = this.email.trim().toLowerCase();
    }
    next();
});

module.exports = mongoose.model("User", userSchema);