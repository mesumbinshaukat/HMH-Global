require('dotenv').config();
const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const app = express();

console.log('Starting HMH Global Backend in Development Mode...');
console.log('Environment Variables:');
console.log('- PORT:', process.env.PORT || 5000);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- MONGO_URI:', process.env.MONGO_URI || 'Not set');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');

// CORS options
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'http://138.68.184.23', 'http://138.68.184.23:3000']
        : 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies
};

// Middlewares
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple test route
app.get("/", (req, res) => res.json({ 
    message: "HMH Global E-commerce API Running", 
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
}));

// Health check
app.get("/health", (req, res) => res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString()
}));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ CORS enabled for: ${corsOptions.origin}`);
    console.log('📝 Test the API:');
    console.log(`   - GET http://localhost:${PORT}/`);
    console.log(`   - GET http://localhost:${PORT}/health`);
});
