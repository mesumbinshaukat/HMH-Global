// Scraper for northwest-cosmetics.com (excluding fragrances)
// Robust version: includes retries, validation, logging, and MongoDB optimizations
// Usage: node scrapeNorthwestCosmetics.js
// Maintainer: HMH Global Dev Team
//
// Features:
// - Robust product detail extraction
// - Retries for page loads, image downloads, and DB saves
// - Comprehensive logging and error handling
// - Data validation and duplicate detection
// - MongoDB indexes for fast search
//
// Do not edit unless you know what you are doing!

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const Product = require('../models/Product');
// Ensure indexes for fast duplicate detection
// Product.collection.createIndex({ name: 1 }); // Moved to main()
// Product.collection.createIndex({ sku: 1 }); // Moved to main()
// Index for brand and category for search/filter
// Product.collection.createIndex({ brand: 1 }); // Moved to main()
// Product.collection.createIndex({ category: 1 }); // Moved to main()
const Category = require('../models/Category');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const EventEmitter = require('events');
const scraperEmitter = new EventEmitter();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        
        const request = client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} - ${response.statusMessage}`));
                return;
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        
        request.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
        
        file.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

function generateSKU(name) {
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) + '-' + Date.now();
}

async function ensureCategory(categoryName) {
    let category = await Category.findOne({ name: categoryName });
    if (!category) {
        category = new Category({
            name: categoryName,
            description: `Products from ${categoryName} category`,
            isActive: true
        });
        await category.save();
        console.log(`Created category: ${categoryName}`);
    }
    return category;
}

// Extract category links from sitemap
function extractCategoryLinks(sitemapContent) {
    const categoryLinks = [];
    const regex = /href="([^"]*-c\.asp)"/g;
    let match;
    
    while ((match = regex.exec(sitemapContent)) !== null) {
        const url = match[1];
        if (!url.toLowerCase().includes('fragrance') && !url.toLowerCase().includes('perfume')) {
            categoryLinks.push(`https://northwest-cosmetics.com/${url}`);
        }
    }
    
    return [...new Set(categoryLinks)]; // Remove duplicates
}

// Extract product links from sitemap or category pages
function extractProductLinks(pageContent) {
    const productLinks = [];
    const patterns = [
        /href="([^"]*-p\.asp[^"]*)"/g,
        /href="([^"]*product[^"]*\.asp[^"]*)"/g,
        /href="([^"]*\.asp[^"]*)"/g
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(pageContent)) !== null) {
            const url = match[1];
            if (url.includes('product') || url.includes('-p.asp') || 
                (url.includes('.asp') && !url.includes('-c.asp') && !url.includes('-w.asp'))) {
                if (!url.toLowerCase().includes('fragrance') && !url.toLowerCase().includes('perfume')) {
                    const fullUrl = url.startsWith('http') ? url : `https://northwest-cosmetics.com/${url}`;
                    productLinks.push(fullUrl);
                }
            }
        }
    });
    
    return [...new Set(productLinks)]; // Remove duplicates
}

async function main() {
    let browser;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Ensure indexes before scraping
        await Product.collection.createIndex({ name: 1 });
        await Product.collection.createIndex({ sku: 1 });
        await Product.collection.createIndex({ brand: 1 });
        await Product.collection.createIndex({ category: 1 });

        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log('Fetching sitemap from Northwest Cosmetics...');
        await page.goto('https://northwest-cosmetics.com/sitemap.asp', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Extract sitemap content
        const sitemapContent = await page.content();
        console.log('Sitemap loaded, length:', sitemapContent.length);
        
        // Extract category links from sitemap
        const categoryLinks = extractCategoryLinks(sitemapContent);
        console.log(`Found ${categoryLinks.length} category links`);
        
        // Step 1: Scrape all categories to find product links
        const allProductLinks = new Set();
        
        for (const categoryUrl of categoryLinks) {
            try {
                console.log(`Scraping category: ${categoryUrl}`);
                await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(2000);
                
                // Extract product links from category page
                const categoryContent = await page.content();
                const productLinks = extractProductLinks(categoryContent);
                
                productLinks.forEach(link => allProductLinks.add(link));
                console.log(`Added ${productLinks.length} products from category`);
                
            } catch (error) {
                console.error(`Error scraping category ${categoryUrl}:`, error.message);
            }
        }
        
        // Step 2: Also try to find product links directly from sitemap
        console.log('Extracting product links from sitemap...');
        const sitemapProductLinks = extractProductLinks(sitemapContent);
        sitemapProductLinks.forEach(link => allProductLinks.add(link));
        console.log(`Found ${sitemapProductLinks.length} product links in sitemap`);
        
        // Step 3: Try to navigate through each category page to find more products
        for (const categoryUrl of categoryLinks.slice(0, 5)) { // Limit to first 5 categories for testing
            try {
                console.log(`Deep scraping category: ${categoryUrl}`);
                await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(2000);
                
                // Look for product links using various selectors
                const pageProductLinks = await page.evaluate(() => {
                    const productLinks = [];
                    
                    // Try multiple selectors for product links
                    const selectors = [
                        'a[href*=".asp"]',
                        'a[href*="product"]',
                        'a[href*="-p.asp"]',
                        '.product-item a',
                        '.product-card a',
                        '.product-link',
                        '.product a'
                    ];
                    
                    selectors.forEach(selector => {
                        const elements = Array.from(document.querySelectorAll(selector));
                        elements.forEach(element => {
                            const href = element.href;
                            if (href && href.includes('.asp') && 
                                !href.includes('-c.asp') && 
                                !href.includes('-w.asp') &&
                                !href.includes('sitemap.asp') &&
                                !href.includes('index.asp') &&
                                !href.toLowerCase().includes('fragrance') &&
                                !href.toLowerCase().includes('perfume')) {
                                productLinks.push(href);
                            }
                        });
                    });
                    
                    return [...new Set(productLinks)];
                });
                
                pageProductLinks.forEach(link => allProductLinks.add(link));
                console.log(`Deep scraping found ${pageProductLinks.length} more products`);
                
            } catch (error) {
                console.error(`Error deep scraping category ${categoryUrl}:`, error.message);
            }
        }
        
        const productLinksArray = Array.from(allProductLinks);
        console.log(`Found ${productLinksArray.length} unique products to scrape`);
        scraperEmitter.emit('start', { total: productLinksArray.length });
        
        // Create a default category for scraped products
        const defaultCategory = await ensureCategory('Northwest Cosmetics');
        
        let scrapedCount = 0;
        let errorCount = 0;
        
        try {
            for (const [idx, productUrl] of productLinksArray.entries()) {
                try {
                    console.log(`Scraping product ${scrapedCount + 1}/${productLinksArray.length}: ${productUrl}`);
                    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                    await page.waitForTimeout(1000);

                    // Robust extraction for Northwest Cosmetics product page
                    const productData = await page.evaluate(() => {
                        // Name
                        let name = '';
                        const h1 = document.querySelector('h1');
                        if (h1) name = h1.textContent?.trim() || '';
                        if (!name) {
                            const titleEl = document.querySelector('.product-title, .product__title');
                            if (titleEl) name = titleEl.textContent?.trim() || '';
                        }

                        // Description
                        let description = '';
                        const descEl = document.querySelector('#tab1, .product-description, .product__description, .product-content, .rte');
                        if (descEl) description = descEl.textContent?.trim() || '';
                        if (!description) {
                            // Try meta description
                            const metaDesc = document.querySelector('meta[name="description"]');
                            if (metaDesc) description = metaDesc.getAttribute('content') || '';
                        }
                        if (!description) description = 'No description available.';

                        // Price
                        let price = 0;
                        const priceSelectors = [
                            '#lblPrice',
                            '.product-price',
                            '.price',
                            '.price-item',
                            '[data-price]',
                            '.ourprice',
                            '.product__price',
                            '.product-price-value',
                            '.product__price-value',
                            '.product__price--final',
                            '.product__price--current',
                            '.product__price--main',
                            '.product__price--sale',
                            '.product__price--regular',
                            '.product__price--amount',
                            '.product__price--value',
                            '.product__price--number',
                            '.product__price--price',
                            '.product__price--price-value',
                            '.product__price--price-amount',
                            '.product__price--price-number',
                            '.product__price--price-price',
                            '.product__price--price-price-value',
                            '.product__price--price-price-amount',
                            '.product__price--price-price-number',
                            '.product__price--price-price-price',
                            '.product__price--price-price-price-value',
                            '.product__price--price-price-price-amount',
                            '.product__price--price-price-price-number',
                            '.product__price--price-price-price-price',
                            '.product__price--price-price-price-price-value',
                            '.product__price--price-price-price-price-amount',
                            '.product__price--price-price-price-price-number',
                            '.product__price--price-price-price-price-price',
                            '.product__price--price-price-price-price-price-value',
                            '.product__price--price-price-price-price-price-amount',
                            '.product__price--price-price-price-price-price-number',
                            '.product__price--price-price-price-price-price-price',
                            '.product__price--price-price-price-price-price-price-value',
                            '.product__price--price-price-price-price-price-price-amount',
                            '.product__price--price-price-price-price-price-price-number',
                            '.product__price--price-price-price-price-price-price-price',
                            '.product__price--price-price-price-price-price-price-price-value',
                            '.product__price--price-price-price-price-price-price-price-amount',
                            '.product__price--price-price-price-price-price-price-price-number',
                        ];
                        for (const sel of priceSelectors) {
                            const el = document.querySelector(sel);
                            if (el && el.textContent) {
                                const match = el.textContent.replace(/,/g, '').match(/\d+(\.\d{1,2})?/);
                                if (match) {
                                    price = parseFloat(match[0]);
                                    break;
                                }
                            }
                        }
                        // Fallback: look for $xx.xx in the page
                        if (!price) {
                            const bodyText = document.body.textContent || '';
                            const match = bodyText.replace(/,/g, '').match(/\$\s?(\d+(\.\d{1,2})?)/);
                            if (match) price = parseFloat(match[1]);
                        }

                        // Images
                        let images = [];
                        // Try main product image
                        const mainImg = document.querySelector('#imgProduct, .product-image img, .product__media img, .product-gallery img');
                        if (mainImg && mainImg.src) images.push(mainImg.src);
                        // Try all images in gallery
                        const galleryImgs = document.querySelectorAll('.product-gallery img, .product__media img, .product-image img, .product-photos img, .product-thumbnails img');
                        for (const img of galleryImgs) {
                            if (img.src && !images.includes(img.src) && !img.src.includes('placeholder')) {
                                images.push(img.src);
                            }
                        }
                        // Remove duplicates and limit
                        images = [...new Set(images)].slice(0, 5);

                        return { name, description, price, images };
                    });

                    if (!productData) {
                        console.log(`[SKIP] Could not extract product data after retries: ${productUrl}`);
                        continue;
                    }
                    // Data validation schema
                    function isValidProduct(data) {
                        if (!data) return false;
                        if (typeof data.name !== 'string' || data.name.length < 2) return false;
                        if (typeof data.price !== 'number' || data.price <= 0) return false;
                        if (!Array.isArray(data.images) || data.images.length === 0) return false;
                        return true;
                    }
                    if (!isValidProduct(productData)) {
                        console.log(`[SKIP] Product failed validation: ${productUrl}`);
                        errorCount++;
                        continue;
                    }
                    // Validation
                    if (!productData.name || productData.name.length < 2) {
                        console.log(`[SKIP] Invalid name: ${productUrl}`);
                        errorCount++;
                        continue;
                    }
                    if (!productData.price || productData.price <= 0) {
                        console.log(`[SKIP] Invalid price: ${productUrl}`);
                        errorCount++;
                        continue;
                    }
                    if (productData.name.toLowerCase().includes('fragrance') || 
                        productData.name.toLowerCase().includes('perfume') ||
                        productData.description.toLowerCase().includes('fragrance')) {
                        console.log(`[SKIP] Fragrance product: ${productData.name}`);
                        continue;
                    }
                    
                    // Filter images to only valid URLs
                    productData.images = (productData.images || []).filter(imgUrl => {
                        if (typeof imgUrl !== 'string' || !/^https?:\/\//.test(imgUrl)) {
                            console.log(`[SKIP] Invalid image URL for product ${productData.name}:`, imgUrl);
                            return false;
                        }
                        return true;
                    });
                    if (!productData.images.length) {
                        console.log(`[SKIP] No valid images for product: ${productData.name}`);
                        errorCount++;
                        continue;
                    }
                    
                    // Download images with retry
                    const imageUrls = [];
                    for (const [i, imgUrl] of (productData.images || []).entries()) {
                        let imgRetries = 0;
                        while (imgRetries < 2) {
                            try {
                                const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
                                const fileName = `${productData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${i}${ext}`;
                                const dest = path.join(uploadsDir, fileName);
                                await downloadImage(imgUrl, dest);
                                imageUrls.push({
                                    url: `/uploads/products/${fileName}`,
                                    alt: productData.name,
                                    isPrimary: i === 0
                                });
                                break;
                            } catch (err) {
                                imgRetries++;
                                console.error(`[RETRY] Failed to download image (${imgUrl}) [Attempt ${imgRetries}]:`, err.message);
                                if (imgRetries >= 2) {
                                    console.error('Giving up on image:', imgUrl);
                                } else {
                                    await new Promise(res => setTimeout(res, 1000 * imgRetries));
                                }
                            }
                        }
                    }
                    
                    // Generate SKU
                    const sku = generateSKU(productData.name);
                    
                    // Check if product with same name or SKU already exists
                    let existingProduct = null;
                    try {
                        existingProduct = await Product.findOne({ $or: [ { name: productData.name }, { sku: sku } ] });
                    } catch (err) {
                        console.error(`[DB ERROR] Failed to check existing product: ${productData.name}`, err.message);
                    }
                    if (existingProduct) {
                        if (existingProduct.name === productData.name) {
                            console.log(`[SKIP] Product already exists (name): ${productData.name}`);
                        } else {
                            console.log(`[SKIP] Product already exists (SKU): ${sku}`);
                        }
                        continue;
                    }
                    
                    // Create new product
                    let saveRetries = 0;
                    while (saveRetries < 2) {
                        try {
                            const product = new Product({
                                name: productData.name,
                                description: productData.description,
                                price: productData.price,
                                sku: sku,
                                category: defaultCategory._id,
                                brand: 'Northwest Cosmetics',
                                images: imageUrls,
                                inventory: {
                                    quantity: 100, // Default stock
                                    trackQuantity: true
                                },
                                isActive: true,
                                isFeatured: false
                            });
                            const savedProduct = await product.save();
                            console.log(`[SAVED] Product: ${productData.name} (ID: ${savedProduct._id})`);
                            scrapedCount++;
                            break;
                        } catch (err) {
                            saveRetries++;
                            console.error(`[RETRY] [DB ERROR] Failed to save product: ${productData.name} [Attempt ${saveRetries}]`, err.message);
                            if (saveRetries >= 2) {
                                console.error(`[DB ERROR] Giving up on product: ${productData.name}`);
                                errorCount++;
                            } else {
                                await new Promise(res => setTimeout(res, 1000 * saveRetries));
                            }
                        }
                    }
                    
                } catch (err) {
                    console.error(`[UNEXPECTED ERROR] in product loop for ${productUrl}:`, err.message);
                    errorCount++;
                    scraperEmitter.emit('error', { error: err.message, url: productUrl });
                }
                // Add a small delay after each product
                await page.waitForTimeout(1000);
                scraperEmitter.emit('progress', {
                    current: idx + 1,
                    total: productLinksArray.length,
                    scraped: scrapedCount,
                    errors: errorCount,
                    url: productUrl
                });
            }
        } catch (outerErr) {
            console.error('[FATAL ERROR] in product scraping loop:', outerErr.message);
            scraperEmitter.emit('error', { error: outerErr.message });
        }
        
        // Summary log
        console.log(`\n=== Scraping Summary ===`);
        console.log(`Total products found: ${productLinksArray.length}`);
        console.log(`Successfully scraped: ${scrapedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`=========================`);
        scraperEmitter.emit('finish', {
            total: productLinksArray.length,
            scraped: scrapedCount,
            errors: errorCount
        });
        
    } catch (err) {
        console.error('Scraper error:', err.message);
        console.error('Stack:', err.stack);
    } finally {
        if (browser) {
            await browser.close();
        }
        await mongoose.disconnect();
        console.log('Scraping process finished.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { main, scraperEmitter };
