require('dotenv').config();
const express = require('express');
const cors = require("cors");
const app = express();
const connectDB = require('./config/database');

// CORS options
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => res.send("HMH Global E-commerce API Running"));
app.use("/api/users", require('./routes/UserRoutes'));
app.use("/api/categories", require('./routes/CategoryRoutes'));
app.use("/api/products", require('./routes/ProductRoutes'));
app.use("/api/cart", require('./routes/CartRoutes'));
app.use("/api/orders", require('./routes/OrderRoutes'));
app.use("/api/reviews", require('./routes/ReviewRoutes'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await connectDB(); // Connect to the database
});
