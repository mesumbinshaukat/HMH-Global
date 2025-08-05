require('dotenv').config();
const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const app = express();
const connectDB = require('./config/database');
const path = require('path');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger middleware
app.use((req, res, next) => {
    const user = req.user ? `${req.user.userId} (${req.user.role})` : 'Unauthenticated';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - User: ${user}`);
    console.log('Headers:', req.headers);
    if (req.cookies) {
        console.log('Cookies:', req.cookies);
    }
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    next();
});

// Routes
app.get("/", (req, res) => res.send("HMH Global E-commerce API Running"));
app.use("/api/users", require('./routes/UserRoutes'));
app.use("/api/categories", require('./routes/CategoryRoutes'));
app.use("/api/products", require('./routes/productRoutes'));
app.use("/api/cart", require('./routes/CartRoutes'));
app.use("/api/orders", require('./routes/OrderRoutes'));
app.use("/api/reviews", require('./routes/ReviewRoutes'));
app.use("/api/admin", require('./routes/AdminRoutes'));

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB(); // Connect to the database
        
        // Initialize JSON Backup Service
        console.log('Initializing JSON Backup Service...');
        const { jsonBackupService } = require('./services/jsonBackupService');
        await jsonBackupService.syncAllToJSON().catch(console.error);
        console.log('JSON Backup Service initialized successfully');
        
        // Only run ensureCartIndexes after some carts exist
        // Comment this out for now to avoid the error
        // await ensureCartIndexes(); 
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
