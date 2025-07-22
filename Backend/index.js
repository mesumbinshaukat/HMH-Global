require('dotenv').config();
const express = require('express');
const cors = require("cors");
const cookieParser = require('cookie-parser');
const app = express();
const connectDB = require('./config/database');
const path = require('path');

// Ensure cart indexes (fixes duplicate key errors for guest carts)
const ensureCartIndexes = require('./scripts/ensureCartIndexes');

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

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
}

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

// Error logger middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Routes
app.get("/", (req, res) => res.send("HMH Global E-commerce API Running"));
app.use("/api/users", require('./routes/UserRoutes')); //checked
app.use("/api/categories", require('./routes/CategoryRoutes')); //checked
app.use("/api/products", require('./routes/ProductRoutes')); //checked
app.use("/api/cart", require('./routes/CartRoutes')); //checked
app.use("/api/orders", require('./routes/OrderRoutes')); //checked (Email isn't sending on Order Placement, other than that it works fine)
app.use("/api/reviews", require('./routes/ReviewRoutes')); //checked
app.use("/api/admin", require('./routes/AdminRoutes'));

// Catch-all handler for React SPA in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB(); // Connect to the database
        await ensureCartIndexes(); // Ensure cart indexes on startup
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
