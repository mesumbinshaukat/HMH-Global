// Script to control product visibility based on Excel sheet
// Usage: node updateProductVisibility.js
// This script reads the NWC Pricelist.xlsx and sets products as visible/invisible
// based on whether they appear in the Excel sheet

const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const path = require('path');
const Product = require('../models/Product');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Function to normalize product names for comparison
function normalizeProductName(name) {
    return name.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
}

// Function to create search variations of a product name
function createSearchVariations(brand, productName) {
    const normalized = normalizeProductName(productName);
    const brandNorm = normalizeProductName(brand);
    
    return [
        normalizeProductName(`${brand} ${productName}`), // Full name
        normalized, // Just product name
        normalizeProductName(productName.split(' ').slice(0, 3).join(' ')), // First 3 words
        normalizeProductName(productName.split(' ').slice(0, 2).join(' ')), // First 2 words
        normalizeProductName(`${brand} ${productName.split(' ')[0]}`), // Brand + first word
    ].filter(v => v.length > 2); // Filter out very short variations
}

// Read Excel file and extract product data
async function readExcelProducts() {
    const filePath = path.join(__dirname, '../../NWC Pricelist.xlsx');
    console.log('Reading Excel file from:', filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.worksheets[0];
    const excelProducts = [];
    
    // Headers are in row 15, products start from row 16
    for (let rowNumber = 16; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        
        const brand = row.getCell(1).text || row.getCell(1).value || '';
        const productName = row.getCell(2).text || row.getCell(2).value || '';
        const unitPrice = parseFloat(row.getCell(6).value) || 0;
        
        // Skip if no brand or product name or price
        if (!brand || !productName || !unitPrice || unitPrice <= 0) {
            continue;
        }
        
        // Skip fragrance products (they shouldn't be visible anyway)
        const lowerBrand = brand.toLowerCase();
        const lowerProduct = productName.toLowerCase();
        if (lowerBrand.includes('perfume') || lowerBrand.includes('fragrance') ||
            lowerProduct.includes('perfume') || lowerProduct.includes('fragrance') ||
            lowerProduct.includes('eau de') || lowerProduct.includes('edp') ||
            lowerProduct.includes('edt') || lowerProduct.includes('cologne')) {
            continue;
        }
        
        // Create search variations for this product
        const searchVariations = createSearchVariations(brand.trim(), productName.trim());
        
        excelProducts.push({
            brand: brand.trim(),
            name: productName.trim(),
            fullName: `${brand.trim()} ${productName.trim()}`.trim(),
            searchVariations,
            unitPrice
        });
    }
    
    console.log(`Found ${excelProducts.length} products in Excel file`);
    return excelProducts;
}

// Find matching database products for each Excel product
async function findMatchingProducts(excelProducts) {
    console.log('Finding matching products in database...');
    
    const matches = [];
    const unmatchedExcel = [];
    
    for (const excelProduct of excelProducts) {
        let foundMatch = false;
        
        // Try to find exact matches first
        for (const variation of excelProduct.searchVariations) {
            const dbProducts = await Product.find({
                $or: [
                    { name: new RegExp(variation.replace(/\s+/g, '\\s+'), 'i') },
                    { 'metadata.originalName': new RegExp(variation.replace(/\s+/g, '\\s+'), 'i') }
                ]
            });
            
            if (dbProducts.length > 0) {
                matches.push({
                    excel: excelProduct,
                    database: dbProducts[0] // Take first match
                });
                foundMatch = true;
                console.log(`✓ Matched: "${excelProduct.fullName}" -> "${dbProducts[0].name}"`);
                break;
            }
        }
        
        if (!foundMatch) {
            unmatchedExcel.push(excelProduct);
        }
    }
    
    console.log(`\nMatching Results:`);
    console.log(`- Matched products: ${matches.length}`);
    console.log(`- Unmatched Excel products: ${unmatchedExcel.length}`);
    
    if (unmatchedExcel.length > 0) {
        console.log(`\nFirst 10 unmatched Excel products:`);
        unmatchedExcel.slice(0, 10).forEach(p => console.log(`  - ${p.fullName}`));
    }
    
    return { matches, unmatchedExcel };
}

async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[Script] Connected to MongoDB');

        // Read Excel products
        const excelProducts = await readExcelProducts();
        
        // Find matching products in database
        const { matches, unmatchedExcel } = await findMatchingProducts(excelProducts);
        
        if (matches.length === 0) {
            console.log('No matches found. Please check if products have been scraped.');
            return;
        }
        
        // Get all database product IDs that should be visible
        const visibleProductIds = matches.map(m => m.database._id);
        
        console.log(`\nUpdating product visibility...`);
        
        // Set all products to inactive first
        await Product.updateMany({}, { isActive: false });
        console.log('Set all products to inactive');
        
        // Set matched products to active
        const updateResult = await Product.updateMany(
            { _id: { $in: visibleProductIds } },
            { 
                isActive: true,
                updatedAt: new Date()
            }
        );
        
        console.log(`Set ${updateResult.modifiedCount} products to active based on Excel sheet`);
        
        // Update prices for matched products
        let priceUpdates = 0;
        for (const match of matches) {
            if (match.excel.unitPrice !== match.database.price) {
                await Product.updateOne(
                    { _id: match.database._id },
                    { 
                        price: match.excel.unitPrice,
                        updatedAt: new Date()
                    }
                );
                priceUpdates++;
            }
        }
        
        console.log(`Updated prices for ${priceUpdates} products`);
        
        // Summary
        const activeCount = await Product.countDocuments({ isActive: true });
        const totalCount = await Product.countDocuments();
        
        console.log(`\n=== Summary ===`);
        console.log(`Total products in database: ${totalCount}`);
        console.log(`Active products (visible on frontend): ${activeCount}`);
        console.log(`Inactive products: ${totalCount - activeCount}`);
        console.log(`Products matched from Excel: ${matches.length}`);
        console.log(`Unmatched Excel products: ${unmatchedExcel.length}`);
        console.log(`Price updates applied: ${priceUpdates}`);
        console.log(`================`);
        
    } catch (error) {
        console.error('Script error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('Script finished.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
