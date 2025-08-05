const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'support', 'sales', 'complaint', 'partnership', 'other'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed'],
    default: 'new'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
contactSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Create indexes for better query performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ category: 1 });
contactSchema.index({ priority: 1 });

module.exports = mongoose.model('Contact', contactSchema);
