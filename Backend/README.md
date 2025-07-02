# HMH Global Ecommerce Backend

A modern ecommerce backend API built with Express.js and Appwrite, featuring a complete product management system and user authentication.

## 🚀 Features

- **Product Management**: Full CRUD operations for products
- **Category Management**: Hierarchical category system
- **User Authentication**: Powered by Appwrite
- **File Storage**: Image uploads via Appwrite Storage
- **Search & Filtering**: Advanced product search and filtering
- **RESTful API**: Clean and intuitive API endpoints
- **Error Handling**: Comprehensive error handling system
- **CORS Support**: Cross-origin resource sharing enabled

## 📋 Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- Appwrite instance (cloud or self-hosted)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install nodemon for development**
   ```bash
   npm install -g nodemon
   # or
   npm install --save-dev nodemon
   ```

## ⚙️ Configuration

1. **Environment Variables**
   
   Update the `.env` file with your Appwrite configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Appwrite Configuration
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id_here
   APPWRITE_API_KEY=your_api_key_here
   APPWRITE_DATABASE_ID=your_database_id_here

   # Collections IDs
   PRODUCTS_COLLECTION_ID=products
   USERS_COLLECTION_ID=users
   ORDERS_COLLECTION_ID=orders
   CATEGORIES_COLLECTION_ID=categories

   # Storage
   STORAGE_BUCKET_ID=product-images

   # JWT Secret (for additional authentication if needed)
   JWT_SECRET=your_jwt_secret_here

   # CORS Origins
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

2. **Appwrite Setup**

   Create the following collections in your Appwrite database:

   ### Products Collection
   ```json
   {
     "name": "string",
     "description": "string",
     "price": "double",
     "category": "string",
     "brand": "string",
     "stock": "integer",
     "images": "array",
     "featured": "boolean",
     "status": "string",
     "rating": "double",
     "numReviews": "integer",
     "createdAt": "string",
     "updatedAt": "string"
   }
   ```

   ### Categories Collection
   ```json
   {
     "name": "string",
     "description": "string",
     "slug": "string",
     "image": "string",
     "parentId": "string",
     "status": "string",
     "sortOrder": "integer",
     "createdAt": "string",
     "updatedAt": "string"
   }
   ```

   ### Users Collection
   ```json
   {
     "userId": "string",
     "firstName": "string",
     "lastName": "string",
     "phone": "string",
     "address": "object",
     "role": "string",
     "preferences": "object",
     "createdAt": "string",
     "updatedAt": "string"
   }
   ```

3. **Create Storage Bucket**
   
   Create a storage bucket named `product-images` for storing product images.

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📚 API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /api/health` - Health check

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search/:searchTerm` - Search products
- `PATCH /api/products/:id/stock` - Update product stock

### Query Parameters for Products
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25)
- `category` - Filter by category
- `brand` - Filter by brand
- `featured` - Filter featured products (true/false)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `search` - Search term
- `orderBy` - Sort field
- `status` - Product status filter

## 🗂️ Project Structure

```
Backend/
├── config/
│   └── appwrite.js          # Appwrite configuration
├── controllers/
│   └── productController.js # Product controller
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── Product.js           # Product model
│   ├── Category.js          # Category model
│   └── User.js              # User model
├── routes/
│   ├── index.js             # Main routes
│   └── productRoutes.js     # Product routes
├── utils/
│   ├── errorHandler.js      # Error handling utilities
│   └── validation.js        # Validation utilities
├── .env                     # Environment variables
├── app.js                   # Main application file
├── package.json             # Project dependencies
└── README.md               # Project documentation
```

## 🧪 Testing the API

### Using curl

1. **Get all products**
   ```bash
   curl http://localhost:5000/api/products
   ```

2. **Create a product**
   ```bash
   curl -X POST http://localhost:5000/api/products \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Sample Product",
       "description": "A sample product",
       "price": 29.99,
       "category": "electronics",
       "brand": "Sample Brand",
       "stock": 100
     }'
   ```

3. **Get featured products**
   ```bash
   curl http://localhost:5000/api/products/featured
   ```

### Using Postman

Import the API endpoints into Postman and test all the CRUD operations.

## 🔒 Authentication

The API includes authentication middleware for protected routes. To use authenticated routes:

1. Create a user session via Appwrite
2. Pass the session ID in the Authorization header:
   ```
   Authorization: Bearer <session_id>
   ```

## 🚧 TODO

- [ ] Add order management
- [ ] Implement cart functionality
- [ ] Add payment integration
- [ ] Create admin dashboard endpoints
- [ ] Add product reviews system
- [ ] Implement inventory management
- [ ] Add email notifications
- [ ] Create API documentation with Swagger

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues, please check:
1. Your Appwrite configuration is correct
2. All environment variables are set
3. Your Appwrite collections are properly configured
4. Your API keys have the necessary permissions

For additional support, please create an issue in the repository.
