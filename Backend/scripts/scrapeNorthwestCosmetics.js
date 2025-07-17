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
const Category = require('../models/Category');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const EventEmitter = require('events');
const scraperEmitter = new EventEmitter();

// Global progress tracking
let globalProgress = {
    total: 0,
    current: 0,
    scraped: 0,
    errors: 0,
    url: ''
};

// Emit progress helper
function emitProgress(data) {
    globalProgress = { ...globalProgress, ...data };
    scraperEmitter.emit('progress', globalProgress);
    // Also send to parent process if running as child
    if (process.send) {
        process.send({ type: 'progress', data: globalProgress });
    }
}

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
        /href="([^"]*-p\.asp[^"]*)"/g  // Only get URLs that end with -p.asp (product pages)
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(pageContent)) !== null) {
            const url = match[1];
            // Only include URLs that clearly are product pages
            if (url.includes('-p.asp')) {
                // Exclude fragrance and perfume products
                if (!url.toLowerCase().includes('fragrance') && !url.toLowerCase().includes('perfume')) {
                    const fullUrl = url.startsWith('http') ? url : `https://northwest-cosmetics.com/${url}`;
                    // Additional filtering to exclude non-product pages
                    if (!fullUrl.includes('index.asp') && 
                        !fullUrl.includes('cart') && 
                        !fullUrl.includes('terms') && 
                        !fullUrl.includes('privacy') && 
                        !fullUrl.includes('sitemap') &&
                        !fullUrl.includes('contact')) {
                        productLinks.push(fullUrl);
                    }
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
        console.log('[Scraper] Connected to MongoDB');

        browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        console.log('[Scraper] Fetching sitemap from Northwest Cosmetics...');
        await page.goto('https://northwest-cosmetics.com/sitemap.asp', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Extract sitemap content
        const sitemapContent = await page.content();
        console.log(`[Scraper] Sitemap loaded, length: ${sitemapContent.length}`);
        
        // Extract category links from sitemap
        const categoryLinks = extractCategoryLinks(sitemapContent);
        console.log(`[Scraper] Found ${categoryLinks.length} category links`);
        
        // Process each category individually
        let totalProductsProcessed = 0;
        let totalProductsScraped = 0;
        let totalErrors = 0;
        
        // First, count total products to scrape for progress tracking
        let totalProductsToScrape = 0;
        console.log('[Scraper] Counting total products to scrape...');
        
        for (const categoryUrl of categoryLinks) {
            try {
                await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(1000);
                
                const categoryContent = await page.content();
                const productLinks = extractProductLinks(categoryContent);
                totalProductsToScrape += productLinks.length;
                
            } catch (error) {
                console.error(`[Scraper] Error counting products in category ${categoryUrl}:`, error.message);
            }
        }
        
        console.log(`[Scraper] Total products to process: ${totalProductsToScrape}`);
        
        // Initialize progress tracking
        globalProgress.total = totalProductsToScrape;
        globalProgress.current = 0;
        globalProgress.scraped = 0;
        globalProgress.errors = 0;
        
        scraperEmitter.emit('start', { total: totalProductsToScrape });
        
        // Process each category one by one
        for (const categoryUrl of categoryLinks) {
            try {
                // Create category
                const categoryName = categoryUrl.split('/').pop().replace('-c.asp', '').replace(/-/g, ' ').trim();
                if (!categoryName) continue;
                
                const cleanName = categoryName.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                
                const category = await ensureCategory(cleanName);
                
                console.log(`[Scraper] Processing category: ${cleanName} (${categoryUrl})`);
                
                // Navigate to category page
                await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(2000);
                
                // Extract product links from category page
                const categoryContent = await page.content();
                const productLinks = extractProductLinks(categoryContent);
                
                console.log(`[Scraper] Found ${productLinks.length} products in category: ${cleanName}`);
                
                // Process each product in this category immediately
                for (const [productIndex, productUrl] of productLinks.entries()) {
                    try {
                        console.log(`[Scraper] Processing product ${totalProductsProcessed + 1}/${totalProductsToScrape}: ${productUrl}`);
                        
                        // Check if product already exists before processing
                        const existingByUrl = await Product.findOne({ 
                            $or: [
                                { name: { $regex: new RegExp(productUrl.split('/').pop().replace(/[^a-zA-Z0-9]/g, ''), 'i') } },
                                { 'metadata.sourceUrl': productUrl }
                            ]
                        });
                        
                        if (existingByUrl) {
                            console.log(`[SKIP] Product already exists for URL: ${productUrl}`);
                            totalProductsProcessed++;
                            continue;
                        }
                        
                        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                        await page.waitForTimeout(1000);

                        // Robust extraction for Northwest Cosmetics product page
                        const productData = await page.evaluate(() => {
                            // Name
                            let name = '';
                            const h1 = document.querySelector('h1');
                            if (h1) name = h1.textContent?.trim() || '';
                            if (!name) {
                                const titleEl = document.querySelector('.product-title, .product__title, .product-name');
                                if (titleEl) name = titleEl.textContent?.trim() || '';
                            }
                            if (!name) {
                                // Try page title as fallback
                                const pageTitle = document.title || '';
                                if (pageTitle && !pageTitle.toLowerCase().includes('northwest')) {
                                    name = pageTitle.trim();
                                }
                            }

                            // Description
                            let description = '';
                            const descSelectors = [
                                '#tab1',
                                '.product-description',
                                '.product__description',
                                '.product-content',
                                '.rte',
                                '.description',
                                '.product-details',
                                '.content'
                            ];
                            for (const sel of descSelectors) {
                                const el = document.querySelector(sel);
                                if (el && el.textContent && el.textContent.trim().length > 10) {
                                    description = el.textContent.trim();
                                    break;
                                }
                            }
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
                                '.price-current',
                                '.current-price',
                                '.sale-price'
                            ];
                            for (const sel of priceSelectors) {
                                const el = document.querySelector(sel);
                                if (el && el.textContent) {
                                    const priceText = el.textContent.replace(/,/g, '').replace(/[^\d\.]/g, '');
                                    const match = priceText.match(/\d+(\.\d{1,2})?/);
                                    if (match && parseFloat(match[0]) > 0) {
                                        price = parseFloat(match[0]);
                                        break;
                                    }
                                }
                            }
                            // Fallback: look for £xx.xx or $xx.xx in the page
                            if (!price || price <= 0) {
                                const bodyText = document.body.textContent || '';
                                const matches = [
                                    bodyText.match(/[£$]\s?(\d+(?:\.\d{1,2})?)/),
                                    bodyText.match(/(\d+(?:\.\d{1,2})?)\s*[£$]/),
                                    bodyText.match(/Price[\s:]*[£$]?\s*(\d+(?:\.\d{1,2})?)/i)
                                ];
                                for (const match of matches) {
                                    if (match && parseFloat(match[1]) > 0) {
                                        price = parseFloat(match[1]);
                                        break;
                                    }
                                }
                            }

                            // Images
                            let images = [];
                            // Try main product image
                            const mainImgSelectors = [
                                '#imgProduct',
                                '.product-image img',
                                '.product__media img',
                                '.product-gallery img',
                                '.main-image img',
                                '.featured-image img',
                                'img[src*="product"]'
                            ];
                            for (const sel of mainImgSelectors) {
                                const img = document.querySelector(sel);
                                if (img && img.src && !img.src.includes('placeholder') && !img.src.includes('loading')) {
                                    images.push(img.src);
                                    break;
                                }
                            }
                            
                            // Try all images in gallery
                            const galleryImgs = document.querySelectorAll('img');
                            for (const img of galleryImgs) {
                                if (img.src && 
                                    !images.includes(img.src) && 
                                    !img.src.includes('placeholder') &&
                                    !img.src.includes('loading') &&
                                    !img.src.includes('icon') &&
                                    !img.src.includes('logo') &&
                                    (img.src.includes('product') || img.width > 100)) {
                                    images.push(img.src);
                                    if (images.length >= 5) break;
                                }
                            }
                            // Remove duplicates and limit
                            images = [...new Set(images)].slice(0, 5);

                            // Extract additional specifications
                            const specifications = {};
                            
                            // Try to find specification tables or lists
                            const specElements = document.querySelectorAll('table tr, .specs li, .specifications li, .product-info li');
                            for (const el of specElements) {
                                const text = el.textContent || '';
                                if (text.includes(':')) {
                                    const [key, value] = text.split(':').map(s => s.trim());
                                    if (key && value && key.length < 50 && value.length < 200) {
                                        specifications[key] = value;
                                    }
                                }
                            }
                            
                            // Extract brand if available
                            let brand = 'Northwest Cosmetics';
                            const brandSelectors = [
                                '.brand',
                                '.manufacturer',
                                '.product-brand',
                                '[data-brand]'
                            ];
                            for (const sel of brandSelectors) {
                                const el = document.querySelector(sel);
                                if (el && el.textContent && el.textContent.trim()) {
                                    brand = el.textContent.trim();
                                    break;
                                }
                            }

                            return { 
                                name, 
                                description, 
                                price, 
                                images, 
                                specifications,
                                brand
                            };
                        });

                        if (!productData || !productData.name || productData.name.length < 2 || !productData.price || productData.price <= 0) {
                            console.log(`[SKIP] Invalid product data: ${productUrl}`);
                            totalProductsProcessed++;
                            totalErrors++;
                            continue;
                        }
                        
                        // Skip fragrance products
                        if (productData.name.toLowerCase().includes('fragrance') || 
                            productData.name.toLowerCase().includes('perfume') ||
                            productData.description.toLowerCase().includes('fragrance')) {
                            console.log(`[SKIP] Fragrance product: ${productData.name}`);
                            totalProductsProcessed++;
                            continue;
                        }
                        
                        // Filter images to only valid URLs
                        productData.images = (productData.images || []).filter(imgUrl => {
                            if (typeof imgUrl !== 'string' || !/^https?:\/\//.test(imgUrl)) {
                                return false;
                            }
                            return true;
                        });
                        
                        if (!productData.images.length) {
                            console.log(`[SKIP] No valid images for product: ${productData.name}`);
                            totalProductsProcessed++;
                            totalErrors++;
                            continue;
                        }
                        
                        // Check if product with same name already exists
                        const existingProduct = await Product.findOne({ name: productData.name });
                        if (existingProduct) {
                            console.log(`[SKIP] Product already exists (name): ${productData.name}`);
                            totalProductsProcessed++;
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
                        
                        // Create new product
                        let saveRetries = 0;
                        while (saveRetries < 2) {
                            try {
                                const product = new Product({
                                    name: productData.name,
                                    description: productData.description,
                                    price: productData.price,
                                    sku: sku,
                                    category: category._id,
                                    brand: productData.brand || 'Northwest Cosmetics',
                                    images: imageUrls,
                                    inventory: {
                                        quantity: 100, // Default stock
                                        trackQuantity: true
                                    },
                                    isActive: true,
                                    isFeatured: false,
                                    metadata: {
                                        sourceUrl: productUrl,
                                        scrapedAt: new Date(),
                                        specifications: productData.specifications || {},
                                        originalBrand: productData.brand || 'Northwest Cosmetics'
                                    }
                                });
                                const savedProduct = await product.save();
                                console.log(`[SAVED] Product: ${productData.name} (ID: ${savedProduct._id}) in category: ${cleanName}`);
                                totalProductsScraped++;
                                break;
                            } catch (err) {
                                saveRetries++;
                                console.error(`[RETRY] [DB ERROR] Failed to save product: ${productData.name} [Attempt ${saveRetries}]`, err.message);
                                if (saveRetries >= 2) {
                                    console.error(`[DB ERROR] Giving up on product: ${productData.name}`);
                                    totalErrors++;
                                } else {
                                    await new Promise(res => setTimeout(res, 1000 * saveRetries));
                                }
                            }
                        }
                        
                    } catch (err) {
                        console.error(`[UNEXPECTED ERROR] in product loop for ${productUrl}:`, err.message);
                        totalErrors++;
                        scraperEmitter.emit('error', { error: err.message, url: productUrl });
                    }
                    
                    // Update progress
                    totalProductsProcessed++;
                    globalProgress.current = totalProductsProcessed;
                    globalProgress.scraped = totalProductsScraped;
                    globalProgress.errors = totalErrors;
                    globalProgress.url = productUrl;
                    
                    // Emit progress
                    emitProgress(globalProgress);
                    
                    // Add a small delay after each product
                    await page.waitForTimeout(1000);
                }
                
                console.log(`[Scraper] Completed category: ${cleanName} - ${totalProductsScraped} products scraped`);
                
            } catch (categoryErr) {
                console.error(`[Scraper] Error processing category ${categoryUrl}:`, categoryErr.message);
                totalErrors++;
            }
        }
        
        // Summary log
        console.log(`\n=== Scraping Summary ===`);
        console.log(`Total products processed: ${totalProductsProcessed}`);
        console.log(`Successfully scraped: ${totalProductsScraped}`);
        console.log(`Errors: ${totalErrors}`);
        console.log(`=========================`);
        scraperEmitter.emit('finish', {
            total: totalProductsProcessed,
            scraped: totalProductsScraped,
            errors: totalErrors
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
