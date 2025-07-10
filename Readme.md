# 🌍 HMH Global Ltd – E-commerce Platform

This is the official e-commerce web platform for **HMH Global Ltd**, built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with comprehensive e-commerce functionality.

---

## 🚀 Features Overview

### 👤 **User Management System**
- ✅ User Registration with email verification
- ✅ Secure Login/Logout with JWT authentication
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ Role-based access control (Admin/Customer)
- ✅ Profile management and updates
- ✅ Account security with bcrypt password hashing

### 🏷️ **Product Catalog Management**
- ✅ **Categories**: Hierarchical category system with parent-child relationships
- ✅ **Products**: Complete CRUD operations with advanced features
  - Product information (name, description, price, SKU)
  - Multiple product images support
  - Inventory tracking and stock management
  - Product ratings and reviews integration
  - Featured products functionality
  - Brand and specification management
  - Product search and filtering
  - Related products suggestions
  - Sale price and discount calculations

### 🛒 **Shopping Cart System**
- ✅ Add/Remove items from cart
- ✅ Update item quantities
- ✅ Real-time inventory validation
- ✅ Automatic price calculations
- ✅ Cart persistence across sessions
- ✅ Clear cart functionality

### 📦 **Order Management System**
- ✅ Complete order processing workflow
- ✅ Order status tracking (pending, processing, shipped, delivered, cancelled)
- ✅ Payment method integration ready
- ✅ Shipping and billing address management
- ✅ Order history and details
- ✅ Order cancellation system
- ✅ Automatic order number generation
- ✅ Order confirmation emails

### ⭐ **Review & Rating System**
- ✅ Product reviews and ratings (1-5 stars)
- ✅ Review moderation system
- ✅ Helpful review marking
- ✅ Review validation and spam protection
- ✅ Automatic product rating calculations
- ✅ Review confirmation emails

### 📧 **Email Notification System**
- ✅ Welcome and verification emails
- ✅ Order confirmation emails
- ✅ Login alert notifications
- ✅ Password reset emails
- ✅ Review confirmation emails
- ✅ SMTP integration with Hostinger

### 🔒 **Security & Validation**
- ✅ JWT-based authentication
- ✅ Password encryption with bcryptjs
- ✅ Input validation and sanitization
- ✅ Role-based middleware protection
- ✅ CORS configuration
- ✅ Error handling and logging

### 🔍 **Advanced Search & Filtering**
- ✅ Product search by name, description, tags
- ✅ Category-based filtering
- ✅ Price range filtering
- ✅ Brand filtering
- ✅ Featured products filtering
- ✅ Sorting by price, name, date, ratings
- ✅ Pagination support

### 📊 **Admin Dashboard Features**
- ✅ Complete product management
- ✅ Category management
- ✅ Order status updates
- ✅ User management
- ✅ Inventory management
- ✅ Review moderation

---

## 🧱 Project Structure

```bash
HMH-Global/
│
├── Backend/                    # Express.js backend (API server)
│   ├── controllers/           # Business logic controllers
│   │   ├── UserController.js     # User authentication & management
│   │   ├── CategoryController.js # Category CRUD operations
│   │   ├── ProductController.js  # Product management
│   │   ├── CartController.js     # Shopping cart operations
│   │   ├── OrderController.js    # Order processing
│   │   └── ReviewController.js   # Review & rating system
│   │
│   ├── models/               # MongoDB schemas
│   │   ├── User.js              # User model with roles
│   │   ├── Category.js          # Category model
│   │   ├── Product.js           # Product model with inventory
│   │   ├── Cart.js              # Shopping cart model
│   │   ├── Order.js             # Order model with status tracking
│   │   └── Review.js            # Review and rating model
│   │
│   ├── routes/               # API route definitions
│   │   ├── UserRoutes.js        # Authentication routes
│   │   ├── CategoryRoutes.js    # Category API routes
│   │   ├── ProductRoutes.js     # Product API routes
│   │   ├── CartRoutes.js        # Cart API routes
│   │   ├── OrderRoutes.js       # Order API routes
│   │   └── ReviewRoutes.js      # Review API routes
│   │
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js              # JWT authentication
│   │   └── role.js              # Role-based access control
│   │
│   ├── config/               # Configuration files
│   │   └── database.js          # MongoDB connection
│   │
│   ├── .env                  # Environment variables
│   ├── index.js              # Entry point
│   ├── package.json          # Dependencies
│   └── API_Documentation.txt # Complete API documentation
│
├── Frontend/               # React.js frontend (coming soon)
│
├── .gitignore
└── README.md
