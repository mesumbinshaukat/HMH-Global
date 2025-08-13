const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

// Load environment variables (prefer .env in dev, fallback to .env.production)
const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : path.join(__dirname, '../.env.production')
require('dotenv').config({ path: envPath });
const Product = require('../models/Product');
const Category = require('../models/Category');

const excelFilePath = path.join(__dirname, '../NWC Pricelist.xlsx');
const uploadsPath = path.join(__dirname, '../uploads');
const placeholderImagePath = '/uploads/placeholder.jpg';

// Map to store category ObjectIds
const categoryMap = new Map();

// Function to connect to MongoDB
async function connectToDB() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hmh-global';
        console.log('Connecting to MongoDB at:', mongoUri.replace(/\/\/[^:]*:[^@]*@/, '//***:***@'));
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

// Function to get or create category
async function getOrCreateCategory(categoryName) {
    if (categoryMap.has(categoryName)) {
        return categoryMap.get(categoryName);
    }

    try {
        let category = await Category.findOne({ name: categoryName });
        if (!category) {
            category = new Category({
                name: categoryName,
                description: `Products from ${categoryName} category`,
                isActive: true,
                sortOrder: 0
            });
            await category.save();
            console.log(`Created new category: ${categoryName}`);
        }
        categoryMap.set(categoryName, category._id);
        return category._id;
    } catch (error) {
        console.error(`Error creating category ${categoryName}:`, error.message);
        // Return a default category ID or create a default one
        let defaultCategory = await Category.findOne({ name: 'Other' });
        if (!defaultCategory) {
            defaultCategory = new Category({
                name: 'Other',
                description: 'Miscellaneous products',
                isActive: true,
                sortOrder: 999
            });
            await defaultCategory.save();
        }
        categoryMap.set('Other', defaultCategory._id);
        return defaultCategory._id;
    }
}

// Function to fetch and save image
async function fetchAndSaveImage(barcode, productName) {
    const imageUrl = `https://northwest-cosmetics.com/images/products/${barcode}.jpg`;
    const fallbackUrl = `https://northwest-cosmetics.com/images/${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    const imageFilePath = path.join(uploadsPath, `${barcode}.jpg`);

    try {
        const response = await axios({ url: imageUrl, responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(imageFilePath));
        await new Promise((resolve, reject) => {
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });
        return `/uploads/${barcode}.jpg`;
    } catch (error) {
        console.error(`Image not found at ${imageUrl}, trying fallback`);
        try {
            const response = await axios({ url: fallbackUrl, responseType: 'stream' });
            response.data.pipe(fs.createWriteStream(imageFilePath));
            await new Promise((resolve, reject) => {
                response.data.on('end', resolve);
                response.data.on('error', reject);
            });
            return `/uploads/${barcode}.jpg`;
        } catch (fallbackError) {
            console.error(`Fallback image not found. Using placeholder for ${barcode}`);
            return placeholderImagePath;
        }
    }
}

// Function to categorize products
function categorizeProduct(brand, productName) {
    const name = productName.toLowerCase();
    if (['bourjois', 'laval', 'technic'].includes(brand.toLowerCase()) || /foundation|lipstick|eyeshadow|mascara|blusher|concealer|bronzer/.test(name)) {
        return 'Cosmetics';
    } else if (brand.toLowerCase() === 'chique studio' || /brush/.test(name)) {
        return 'Makeup Brushes';
    } else if (brand.toLowerCase() === 'airpure' || /candle|air-o-matic|press fresh/.test(name)) {
        return 'Home Fragrance';
    } else if (brand.toLowerCase() === 'directions' || /hair colour/.test(name)) {
        return 'Hair Colour';
    } else if (brand.toLowerCase() === 'jones&co' || /hair bobbles|velcro rollers|scrunchies|hair clamps/.test(name)) {
        return 'Hair Accessories';
    } else if (brand.toLowerCase() === 'classics' || /nail polish|acetone|nail buffer/.test(name)) {
        return 'Nail Care';
    } else if (/makeup blenders|makeup bags/.test(name)) {
        return 'Makeup Accessories';
    } else if (/earrings/.test(name)) {
        return 'Jewelry';
    } else if (/shower cap|exfoliating gloves/.test(name)) {
        return 'Bath Accessories';
    } else {
        return 'Other';
    }
}

// Main function to import products (test with limited products first)
async function importProducts() {
    try {
        await connectToDB();

        // Ensure uploads directory exists
        fs.ensureDirSync(uploadsPath);
        console.log('Uploads directory ready:', uploadsPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelFilePath);
        const worksheet = workbook.getWorksheet(1);
        
        console.log('Excel file loaded successfully');
        console.log('Processing all products from Excel file...');

        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 16) {
                rows.push({ row, rowNumber });
            }
        });

        let processedCount = 0;
const allRows = [...rows]; // Process all rows for full import
const maxProducts = allRows.length; // Use all products for full import

        for (const { row, rowNumber } of rows) {
            if (processedCount >= maxProducts) break;

            const brand = row.getCell(1).value;
            const product = row.getCell(2).value;
            const barcode = row.getCell(3).value;
            const itemCode = row.getCell(4).value;
            const pcsPerDisplay = row.getCell(5).value || 1;
            const unitPrice = row.getCell(6).value || 0;
            const packPrice = row.getCell(7).value || 0;
            const commodityCode = row.getCell(10).value;

            // Skip if fragrance or missing essential data
            if (commodityCode === 33030010 || !product || !brand) {
                console.log(`Skipping row ${rowNumber}: fragrance or missing data`);
                continue;
            }

            console.log(`\nProcessing product ${processedCount + 1}: ${product} by ${brand}`);

            try {
                // Check if product already exists
                const existingProduct = await Product.findOne({ sku: itemCode });
                if (existingProduct) {
                    console.log(`Product with SKU ${itemCode} already exists. Skipping.`);
                    continue;
                }

                const categoryName = categorizeProduct(brand, product);
                const categoryId = await getOrCreateCategory(categoryName);
                
                console.log(`Category: ${categoryName}`);
                
                // Try to fetch actual image, fallback to placeholder
                let imagePath = placeholderImagePath;
                try {
                    imagePath = await fetchAndSaveImage(barcode, product);
                    console.log(`Image: ${imagePath}`);
                } catch (error) {
                    console.log(`Image fetch failed, using placeholder: ${placeholderImagePath}`);
                }

                const newProduct = new Product({
                    name: product,
                    description: `${brand} ${product}`,
                    shortDescription: `${brand} ${product}`,
                    price: parseFloat(unitPrice) || 0,
                    sku: itemCode || `SKU-${Date.now()}-${processedCount}`,
                    category: categoryId,
                    brand: brand,
                    images: [{ url: imagePath, alt: product, isPrimary: true }],
                    inventory: { 
                        quantity: parseInt(pcsPerDisplay) || 0,
                        trackQuantity: true 
                    },
                    isActive: true,
                    metadata: {
                        sourceUrl: 'northwest-cosmetics.com',
                        scrapedAt: new Date()
                    }
                });

                await newProduct.save();
                console.log(`✓ Product saved: ${product} (SKU: ${itemCode})`);
                processedCount++;

            } catch (error) {
                console.error(`✗ Error saving product ${product}:`, error.message);
                if (error.code === 11000) {
                    console.error('Duplicate key error - product may already exist');
                }
            }
        }

        console.log(`\n=== Import Complete ===`);
        console.log(`Products processed: ${processedCount}`);
        console.log(`Upload directory: ${uploadsPath}`);
        
    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

importProducts();
