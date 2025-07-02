const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import configurations and routes
const { client } = require('./config/appwrite');
const apiRoutes = require('./routes/index');
const { notFound, handleError } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Store client instance for middleware access
app.locals.client = client;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to HMH Global Ecommerce API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      documentation: 'Coming soon...'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use((err, req, res, next) => {
  handleError(res, err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HMH Global Backend is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`💾 Using Appwrite at: ${process.env.APPWRITE_ENDPOINT}`);
});
