// Script to control product visibility based on Excel sheet
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/hmh-global');
        console.log('[Script] Connected to MongoDB');
    } catch (error) {
        console.error('[Script] MongoDB connection error:', error.message);
        process.exit(1);
    }
}

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    salePrice: Number,
    description: String,
    imageUrl: String,
    category: String,
    slug: String,
    sku: String,
    stock: Number,
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Read Excel file and extract product data
async function readExcelProducts() {
    const filePath = path.join('/var/www/hmh-global', 'NWC Pricelist.xlsx');
    console.log('Reading Excel file from:', filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0];
    const excelProducts = [];
    
    // Headers are in row 15, products start from row 16
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 16) { // Skip header rows
            const productName = row.getCell(2).value; // Column B
            const price = row.getCell(3).value; // Column C
            
            if (productName && typeof productName === 'string' && productName.trim()) {
                excelProducts.push({
                    name: productName.trim(),
                    price: price || 0
                });
            }
        }
    });
    
    console.log(`Found ${excelProducts.length} products in Excel file`);
    return excelProducts;
}

// Normalize product name for comparison
function normalizeProductName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
}

// Find matching products in database
async function matchProductsWithDatabase(excelProducts) {
    console.log('Finding matching products in database...');
    
    const allDbProducts = await Product.find({});
    const matches = [];
    const unmatchedExcel = [];
    
    for (const excelProduct of excelProducts) {
        const normalizedExcelName = normalizeProductName(excelProduct.name);
        
        // Try to find exact or close match
        let matchedProduct = null;
        
        // First try exact match
        matchedProduct = allDbProducts.find(dbProduct => 
            normalizeProductName(dbProduct.name) === normalizedExcelName
        );
        
        // If no exact match, try partial match
        if (!matchedProduct) {
            matchedProduct = allDbProducts.find(dbProduct => {
                const normalizedDbName = normalizeProductName(dbProduct.name);
                return normalizedDbName.includes(normalizedExcelName) || 
                       normalizedExcelName.includes(normalizedDbName);
            });
        }
        
        if (matchedProduct) {
            matches.push({
                excelProduct,
                dbProduct: matchedProduct
            });
            console.log(`✓ Matched: "${excelProduct.name}" -> "${matchedProduct.name}"`);
        } else {
            unmatchedExcel.push(excelProduct);
        }
    }
    
    console.log(`\nMatching Results:`);
    console.log(`- Matched products: ${matches.length}`);
    console.log(`- Unmatched Excel products: ${unmatchedExcel.length}`);
    
    if (unmatchedExcel.length > 0) {
        console.log('\nFirst 10 unmatched Excel products:');
        unmatchedExcel.slice(0, 10).forEach(product => {
            console.log(`  - ${product.name}`);
        });
    }
    
    return { matches, unmatchedExcel };
}

// Update product visibility and prices
async function updateProductVisibility(matches) {
    console.log('\nUpdating product visibility...');
    
    // First, set all products to inactive
    await Product.updateMany({}, { isVisible: false });
    console.log('Set all products to inactive');
    
    // Then set matched products to active and update prices
    let priceUpdates = 0;
    const matchedProductIds = matches.map(match => match.dbProduct._id);
    
    await Product.updateMany(
        { _id: { $in: matchedProductIds } },
        { isVisible: true }
    );
    console.log(`Set ${matchedProductIds.length} products to active based on Excel sheet`);
    
    // Update prices for matched products
    for (const match of matches) {
        if (match.excelProduct.price > 0) {
            await Product.updateOne(
                { _id: match.dbProduct._id },
                { 
                    price: match.excelProduct.price,
                    updatedAt: new Date()
                }
            );
            priceUpdates++;
        }
    }
    
    console.log(`Updated prices for ${priceUpdates} products`);
    
    // Get final counts
    const totalProducts = await Product.countDocuments({});
    const activeProducts = await Product.countDocuments({ isVisible: true });
    const inactiveProducts = totalProducts - activeProducts;
    
    console.log('\n=== Summary ===');
    console.log(`Total products in database: ${totalProducts}`);
    console.log(`Active products (visible on frontend): ${activeProducts}`);
    console.log(`Inactive products: ${inactiveProducts}`);
    console.log(`Products matched from Excel: ${matches.length}`);
    console.log(`Price updates applied: ${priceUpdates}`);
    console.log('================');
}

// Main function
async function main() {
    try {
        await connectToMongoDB();
        
        const excelProducts = await readExcelProducts();
        const { matches, unmatchedExcel } = await matchProductsWithDatabase(excelProducts);
        
        await updateProductVisibility(matches);
        
    } catch (error) {
        console.error('Script error:', error.message);
        console.error('Stack:', error);
    } finally {
        console.log('Script finished.');
        mongoose.connection.close();
        process.exit(0);
    }
}

main();
