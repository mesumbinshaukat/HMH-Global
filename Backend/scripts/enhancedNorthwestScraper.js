// Enhanced Northwest Cosmetics Scraper v2.0 - Professional Edition
// Complete e-commerce scraper with Excel integration and advanced features
// Usage: node enhancedNorthwestScraper.js [--test] [--limit=10] [--update-images]
// Author: HMH Global Development Team
//
// REVOLUTIONARY FEATURES v2.0:
// ✓ Excel price integration with automated +50p markup
// ✓ Organized image folders per product (no mixing!)
// ✓ Enhanced sitemap parsing with smart filtering
// ✓ Professional retry mechanisms with exponential backoff
// ✓ Real-time progress tracking and notifications
// ✓ Category-specific exclusions (no fragrances)
// ✓ Image update capabilities for existing products
// ✓ Comprehensive error handling and logging
// ✓ Test mode for safe development
// ✓ Smart SKU generation and duplicate detection

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const ExcelJS = require('exceljs');
const Product = require('../models/Product');
const Category = require('../models/Category');
// Prefer local .env (development); fallback to .env.production if needed
const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : path.join(__dirname, '../.env.production')
require('dotenv').config({ path: envPath });
const EventEmitter = require('events');
const scraperEmitter = new EventEmitter();

// Configuration
const CONFIG = {
    TEST_MODE: process.argv.includes('--test'),
    PRODUCT_LIMIT: process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || null,
    UPDATE_IMAGES: process.argv.includes('--update-images'),
    EXCEL_FILE: path.join(__dirname, '../NWC Pricelist.xlsx'),
    BASE_UPLOAD_DIR: path.join(__dirname, '../uploads'),
    PRICE_MARKUP: 0.50, // Add 50 pence to each product
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    MAX_IMAGES_PER_PRODUCT: 5,
    EXCLUDED_KEYWORDS: ['fragrance', 'perfume', 'eau de toilette', 'cologne'],
    BROWSER_CONFIG: {
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-zygote',
            '--disable-features=site-per-process' // Help with frame issues
        ],
        defaultViewport: { width: 1920, height: 1080 }
    }
};

// Global progress tracking
let globalProgress = {
    total: 0,
    current: 0,
    scraped: 0,
    errors: 0,
    skipped: 0,
    categories: 0,
    url: '',
    phase: 'Initializing'
};

// Excel price data cache
let priceData = new Map();

// Utility functions
const log = (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`, data);
    
    // Emit progress for external monitoring
    if (process.send) {
        process.send({ 
            type: 'log', 
            level, 
            message, 
            data: { ...data, timestamp } 
        });
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sanitizeFileName = (name) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
};

const createProductFolder = (productName) => {
    const sanitizedName = sanitizeFileName(productName);
    const productFolder = path.join(CONFIG.BASE_UPLOAD_DIR, 'products', sanitizedName);
    
    if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
        log('info', `Created product folder: ${productFolder}`);
    }
    
    return productFolder;
};

const emitProgress = (data) => {
    globalProgress = { ...globalProgress, ...data };
    scraperEmitter.emit('progress', globalProgress);
    
    if (process.send) {
        process.send({ type: 'progress', data: globalProgress });
    }
};

// Excel integration
const loadExcelPrices = async () => {
    try {
        log('info', 'Loading Excel price data...');
        
        if (!fs.existsSync(CONFIG.EXCEL_FILE)) {
            log('warning', 'Excel file not found, prices will be scraped from website');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(CONFIG.EXCEL_FILE);
        const worksheet = workbook.getWorksheet(1);
        
        let loadedPrices = 0;
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 16) { // Skip header rows
                const brand = row.getCell(1).value;
                const productName = row.getCell(2).value;
                const barcode = row.getCell(3).value;
                const itemCode = row.getCell(4).value;
                const unitPrice = parseFloat(row.getCell(6).value) || 0;
                const commodityCode = row.getCell(10).value;
                
                // Skip fragrances
                if (commodityCode === 33030010) return;
                
                if (productName && unitPrice > 0) {
                    const key = productName.toLowerCase().trim();
                    priceData.set(key, {
                        originalPrice: unitPrice,
                        finalPrice: unitPrice + CONFIG.PRICE_MARKUP,
                        brand,
                        barcode,
                        itemCode
                    });
                    loadedPrices++;
                }
            }
        });
        
        log('info', `Loaded ${loadedPrices} products with prices from Excel`);
    } catch (error) {
        log('error', 'Failed to load Excel prices', { error: error.message });
    }
};

// Enhanced image download with organized folders
const downloadImage = async (url, productName, imageIndex = 0) => {
    return new Promise((resolve, reject) => {
        const productFolder = createProductFolder(productName);
        const ext = path.extname(new URL(url).pathname) || '.jpg';
        const fileName = `image_${imageIndex}${ext}`;
        const dest = path.join(productFolder, fileName);
        
        // Skip if file already exists and not in update mode
        if (fs.existsSync(dest) && !CONFIG.UPDATE_IMAGES) {
            resolve({
                url: `/uploads/products/${sanitizeFileName(productName)}/${fileName}`,
                alt: productName,
                isPrimary: imageIndex === 0
            });
            return;
        }
        
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
                resolve({
                    url: `/uploads/products/${sanitizeFileName(productName)}/${fileName}`,
                    alt: productName,
                    isPrimary: imageIndex === 0
                });
            });
        });
        
        request.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
        
        file.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
        
        // Timeout after 30 seconds
        request.setTimeout(30000, () => {
            request.abort();
            reject(new Error('Image download timeout'));
        });
    });
};

// Enhanced category and product link extraction
const extractCategoryLinks = (sitemapContent) => {
    const categoryLinks = [];
    const patterns = [
        /href="([^"]*-c\.asp)"/g,
        /href="([^"]*category[^"]*)"/gi,
        /href="([^"]*cat[^"]*)"/gi
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(sitemapContent)) !== null) {
            const url = match[1];
            const fullUrl = url.startsWith('http') ? url : `https://northwest-cosmetics.com/${url}`;
            
            // Exclude fragrance categories
            const isFragrance = CONFIG.EXCLUDED_KEYWORDS.some(keyword => 
                fullUrl.toLowerCase().includes(keyword)
            );
            
            if (!isFragrance) {
                categoryLinks.push(fullUrl);
            }
        }
    });
    
    return [...new Set(categoryLinks)];
};

const extractProductLinks = (pageContent) => {
    const productLinks = [];
    const patterns = [
        /href="([^"]*-p\.asp[^"]*)"/g
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(pageContent)) !== null) {
            const url = match[1];
            
            // Skip URLs that are clearly not product pages
            if (url.includes('.css') || url.includes('.js') || url.includes('.png') || 
                url.includes('.jpg') || url.includes('.gif') || url.includes('cdn.') ||
                url.startsWith('//') || url.startsWith('#')) {
                continue;
            }
            
            const fullUrl = url.startsWith('http') ? url : `https://northwest-cosmetics.com/${url}`;
            
            // Enhanced filtering
            const isValidProduct = url.includes('-p.asp');
            const isFragrance = CONFIG.EXCLUDED_KEYWORDS.some(keyword => 
                fullUrl.toLowerCase().includes(keyword)
            );
            const isExcluded = ['index.asp', 'cart', 'terms', 'privacy', 'sitemap', 'contact', 'login', 'register'].some(
                exclude => fullUrl.includes(exclude)
            );
            
            if (isValidProduct && !isFragrance && !isExcluded) {
                productLinks.push(fullUrl);
            }
        }
    });
    
    return [...new Set(productLinks)];
};

// Enhanced category creation
const ensureCategory = async (categoryName) => {
    try {
        let category = await Category.findOne({ name: categoryName });
        if (!category) {
            category = new Category({
                name: categoryName,
                description: `Premium ${categoryName} products from Northwest Cosmetics`,
                isActive: true,
                sortOrder: Math.floor(Math.random() * 100)
            });
            await category.save();
            log('info', `Created category: ${categoryName}`);
        }
        return category;
    } catch (error) {
        log('error', `Failed to create category: ${categoryName}`, { error: error.message });
        // Return default category
        return await Category.findOne({ name: 'Other' }) || await ensureCategory('Other');
    }
};

// Enhanced product data extraction
const extractProductData = async (page) => {
    return await page.evaluate(() => {
        // Enhanced name extraction
        let name = '';
        const nameSelectors = [
            'h1',
            '.product-title',
            '.product__title',
            '.product-name',
            '.item-name',
            '[data-product-name]'
        ];
        
        for (const selector of nameSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent && el.textContent.trim().length > 2) {
                name = el.textContent.trim();
                break;
            }
        }
        
        if (!name) {
            const pageTitle = document.title || '';
            if (pageTitle && !pageTitle.toLowerCase().includes('northwest')) {
                name = pageTitle.replace(/[|-].*$/, '').trim();
            }
        }

        // Enhanced description extraction
        let description = '';
        const descSelectors = [
            '#tab1',
            '.product-description',
            '.product__description',
            '.product-content',
            '.rte',
            '.description',
            '.product-details',
            '.content',
            '.product-info',
            '[data-product-description]'
        ];
        
        for (const selector of descSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent && el.textContent.trim().length > 20) {
                description = el.textContent.trim().substring(0, 1000);
                break;
            }
        }
        
        if (!description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            description = metaDesc ? metaDesc.getAttribute('content') || '' : '';
        }
        
        if (!description) {
            description = `Premium ${name} from Northwest Cosmetics`;
        }

        // Enhanced price extraction
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
            '.sale-price',
            '.price-now',
            '.final-price'
        ];
        
        for (const selector of priceSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent) {
                const priceText = el.textContent.replace(/[^\d.]/g, '');
                const match = priceText.match(/\d+(\.\d{1,2})?/);
                if (match && parseFloat(match[0]) > 0) {
                    price = parseFloat(match[0]);
                    break;
                }
            }
        }
        
        // Fallback price search in page content
        if (!price || price <= 0) {
            const pageText = document.body.textContent;
            const poundRegex = /£\s*(\d+\.\d{1,2})/g;
            const matches = pageText.match(poundRegex);
            if (matches && matches.length > 0) {
                const firstPrice = matches[0].replace(/[^\d.]/g, '');
                price = parseFloat(firstPrice);
            }
        }

        // Enhanced image extraction
        let images = [];
        const imageSelectors = [
            '.zoom img',
            '.product-image img',
            '.gallery img',
            '.product-photo img',
            '.product__media img',
            '#ProductImage',
            '.product-single__media img',
            '.product-img',
            '.product-gallery img',
            '#Image'
        ];
        
        // First try to get specific product images
        for (const selector of imageSelectors) {
            const els = document.querySelectorAll(selector);
            if (els.length > 0) {
                for (const el of els) {
                    const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src');
                    if (src && !src.includes('placeholder') && !src.includes('loader')) {
                        images.push(src);
                    }
                }
                if (images.length > 0) break;
            }
        }
        
        // If no images found, try to get all relevant images
        if (images.length === 0) {
            const allImages = document.querySelectorAll('img');
            for (const img of allImages) {
                const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                const width = img.width || img.getAttribute('width');
                const height = img.height || img.getAttribute('height');
                const alt = img.alt || '';
                
                if (src && 
                    !src.includes('logo') && 
                    !src.includes('banner') && 
                    !src.includes('icon') &&
                    (parseInt(width) > 100 || parseInt(height) > 100 || alt.includes(name))) {
                    images.push(src);
                }
            }
        }
        
        // Add thumbnail as first image if present
        const thumbnail = document.querySelector('.thumbnail img');
        if (thumbnail && thumbnail.src) {
            images.unshift(thumbnail.src);
        }
        
        // Remove duplicates and limit number of images
        images = [...new Set(images)].slice(0, 10);
        
        return {
            name,
            description,
            price,
            images,
            brand: 'Northwest Cosmetics', // Default brand
            shortDescription: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
            salePrice: 0, // No sale price by default
            stockQuantity: 100, // Default stock
            pageTitle: document.title || ''
        };
    });
};

// Enhanced product scraping with retry mechanism
const scrapeProductWithRetry = async (browser, productUrl, maxRetries = CONFIG.MAX_RETRIES) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let page;
        try {
            log('info', `Processing product: ${productUrl} (attempt ${attempt}/${maxRetries})`);
            
            page = await browser.newPage();
            await page.setDefaultTimeout(45000); // Increased timeout
            
            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // Navigate to product page with proper wait conditions
            const response = await page.goto(productUrl, { 
                waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
                timeout: 45000 
            });
            
            if (!response || !response.ok()) {
                throw new Error(`HTTP ${response?.status()} - Page failed to load`);
            }
            
            // Wait for page to be completely ready
            await page.waitForFunction('document.readyState === "complete"', { timeout: 10000 });
            
            // Additional wait for dynamic content
            await sleep(3000);
            
            // Check if page actually loaded properly
            const title = await page.title();
            if (!title || title.includes('404') || title.includes('Error') || title.length < 5) {
                throw new Error('Page not found or error page');
            }
            
            // Extract data from the page
            const productData = await extractProductData(page);
            
            // Extract category name from URL
            const categoryMatch = productUrl.match(/\/([^\/]+-\d+)-p\.asp/);
            const categoryName = categoryMatch ? categoryMatch[1].split('-').slice(0, -1).join(' ') : 'Other';
            
            // Create or find category
            const category = await ensureCategory(categoryName);
            
            // Adjust price if we have it in Excel
            const excelKey = productData.name.toLowerCase().trim();
            if (priceData.has(excelKey)) {
                const priceInfo = priceData.get(excelKey);
                productData.price = priceInfo.finalPrice;
                productData.brand = priceInfo.brand || productData.brand;
            } else if (productData.price > 0) {
                // Add markup if we have a scraped price
                productData.price += CONFIG.PRICE_MARKUP;
            } else {
                // Default price if nothing found
                productData.price = 2.99;
            }
            
            // Generate SKU
            const timestamp = Date.now();
            const sku = `NWC-${productData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}-${timestamp}`;
            
            // Download images
            const productImages = [];
            for (let i = 0; i < Math.min(productData.images.length, CONFIG.MAX_IMAGES_PER_PRODUCT); i++) {
                try {
                    const image = await downloadImage(productData.images[i], productData.name, i);
                    productImages.push(image);
                } catch (imageError) {
                    log('warning', `Failed to download image ${i} for ${productData.name}`, { error: imageError.message });
                }
            }
            
            // Create product object
            const product = {
                name: productData.name,
                description: productData.description,
                shortDescription: productData.shortDescription,
                price: productData.price,
                sku: sku,
                category: category._id,
                brand: productData.brand,
                images: productImages,
                inventory: {
                    quantity: 100,
                    lowStockThreshold: 10,
                    trackQuantity: true
                },
                tags: [categoryName, 'Northwest', 'Cosmetics'],
                isActive: true,
                metadata: {
                    sourceUrl: productUrl,
                    scrapedAt: new Date()
                }
            };
            
            // Clean up
            if (page) await page.close();
            
            return product;
        } catch (error) {
            if (page) {
                try {
                    // Take screenshot for debugging
                    if (CONFIG.TEST_MODE) {
                        const screenshotPath = path.join(__dirname, `../logs/error_${Date.now()}.png`);
                        await page.screenshot({ path: screenshotPath, fullPage: true });
                        log('info', `Error screenshot saved to ${screenshotPath}`);
                    }
                    await page.close();
                } catch (closeError) {
                    log('warning', 'Error closing page', { error: closeError.message });
                }
            }
            
            // Log the error
            log('warning', `Retry ${attempt}/${maxRetries} for product: ${productUrl}`, { error: error.message });
            
            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
                throw new Error(`Failed to process product after ${maxRetries} retries: ${error.message}`);
            }
            
            // Exponential backoff before retrying
            const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
            await sleep(delay);
        }
    }
};

// Process a single category page
const processCategory = async (browser, categoryUrl) => {
    let page;
    try {
        log('info', `Processing category: ${categoryUrl}`);
        emitProgress({ url: categoryUrl, phase: 'Processing category' });
        
        page = await browser.newPage();
        await page.setDefaultTimeout(30000);
        
        // Extract category name from URL
        const categoryMatch = categoryUrl.match(/\/([^\/]+-\d+)-c\.asp/);
        let categoryName = categoryMatch ? categoryMatch[1].replace(/-\d+$/, '').replace(/-/g, ' ') : 'Other';
        categoryName = categoryName.replace(/\b\w/g, c => c.toUpperCase()); // Title case
        
        const response = await page.goto(categoryUrl, { waitUntil: 'networkidle2' });
        
        if (!response || !response.ok()) {
            log('warning', `Failed to load category: ${categoryUrl}`, { status: response?.status() });
            return { count: 0, productLinks: [] };
        }
        
        // Extract the category page content
        const content = await page.content();
        
        // Find all product links
        const productLinks = extractProductLinks(content);
        log('info', `Found ${productLinks.length} products in ${categoryName}`);
        
        // Clean up
        await page.close();
        
        return { count: productLinks.length, productLinks, categoryName };
    } catch (error) {
        log('error', `Failed to process category: ${categoryUrl}`, { error: error.message });
        if (page) await page.close();
        return { count: 0, productLinks: [], error: error.message };
    }
};

// Process and save a product
const saveProduct = async (productData) => {
    try {
        // Check if product with this name already exists
        const existingProduct = await Product.findOne({ name: productData.name });
        
        if (existingProduct) {
            log('info', `Product already exists: ${productData.name}`);
            
            // Update if requested
            if (CONFIG.UPDATE_IMAGES) {
                // Only update images and keep rest of data
                existingProduct.images = productData.images;
                existingProduct.metadata.scrapedAt = new Date();
                await existingProduct.save();
                log('info', `Updated images for: ${productData.name}`);
                return { success: true, updated: true, id: existingProduct._id };
            }
            
            return { success: true, skipped: true, id: existingProduct._id };
        }
        
        // Create new product
        const newProduct = new Product(productData);
        await newProduct.save();
        log('info', `Saved new product: ${productData.name}`);
        
        return { success: true, created: true, id: newProduct._id };
    } catch (error) {
        log('error', `Failed to save product: ${productData.name}`, { error: error.message });
        return { success: false, error: error.message };
    }
};

// Main scraper function
const startScraper = async () => {
    log('info', 'Starting Enhanced Northwest Cosmetics Scraper v2.0');
    if (CONFIG.TEST_MODE) {
        log('info', 'Running in TEST MODE - Limited scraping');
    }
    
    // Load Excel prices
    await loadExcelPrices();
    
    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hmh-global');
        log('info', 'Connected to MongoDB');
    } catch (error) {
        log('error', 'Failed to connect to MongoDB', { error: error.message });
        process.exit(1);
    }
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch(CONFIG.BROWSER_CONFIG);
        
        // Load sitemap to get all category URLs
        let sitemapContent = '';
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                retryCount++;
                log('info', `Loading sitemap attempt ${retryCount}/${maxRetries}`);
                
                const page = await browser.newPage();
                await page.setDefaultTimeout(30000);
                
                await page.goto('https://northwest-cosmetics.com/sitemap.asp', { waitUntil: 'networkidle2' });
                sitemapContent = await page.content();
                
                await page.close();
                
                if (sitemapContent.length > 1000) {
                    log('info', `Sitemap loaded successfully (${sitemapContent.length} chars)`);
                    break;
                } else {
                    throw new Error('Sitemap content too small');
                }
            } catch (error) {
                log('warning', `Failed to load sitemap (attempt ${retryCount}/${maxRetries})`, { error: error.message });
                
                if (retryCount === maxRetries) {
                    log('error', 'Failed to load sitemap after max retries');
                    emitProgress({ phase: 'Failed' });
                    return;
                }
                
                await sleep(2000 * retryCount);
            }
        }
        
        // Extract category links
        const categoryLinks = extractCategoryLinks(sitemapContent);
        log('info', `Found ${categoryLinks.length} category links`);
        
        // Limit categories in test mode
        const categoriesToProcess = CONFIG.TEST_MODE ? categoryLinks.slice(0, 2) : categoryLinks;
        
        emitProgress({ 
            total: categoriesToProcess.length, 
            categories: categoriesToProcess.length,
            phase: 'Processing categories'
        });
        
        // Process each category
        let allProductLinks = [];
        for (let i = 0; i < categoriesToProcess.length; i++) {
            const categoryUrl = categoriesToProcess[i];
            
            emitProgress({ current: i + 1, url: categoryUrl });
            
            const { productLinks, categoryName } = await processCategory(browser, categoryUrl);
            log('info', `Completed category ${categoryName}: ${productLinks.length} products processed`);
            
            // Add to the total list of products
            allProductLinks = [...allProductLinks, ...productLinks];
            
            // Introduce a delay between categories to avoid overloading the server
            if (i < categoriesToProcess.length - 1) {
                await sleep(1000);
            }
        }
        
        // Remove duplicates
        allProductLinks = [...new Set(allProductLinks)];
        log('info', `Total unique products found: ${allProductLinks.length}`);
        
        // Limit products in test mode or if specified
        let productsToProcess = allProductLinks;
        if (CONFIG.TEST_MODE) {
            productsToProcess = allProductLinks.slice(0, 5);
            log('info', `Test mode: Limited to ${productsToProcess.length} products`);
        } else if (CONFIG.PRODUCT_LIMIT) {
            const limit = parseInt(CONFIG.PRODUCT_LIMIT);
            productsToProcess = allProductLinks.slice(0, limit);
            log('info', `Limited to ${productsToProcess.length} products as requested`);
        }
        
        emitProgress({ 
            total: productsToProcess.length, 
            current: 0,
            scraped: 0,
            errors: 0,
            skipped: 0,
            phase: 'Processing products'
        });
        
        // Process each product
        for (let i = 0; i < productsToProcess.length; i++) {
            const productUrl = productsToProcess[i];
            
            try {
                emitProgress({ 
                    current: i + 1, 
                    url: productUrl,
                    phase: 'Processing product'
                });
                
                // Scrape product
                const productData = await scrapeProductWithRetry(browser, productUrl);
                
                // Save product
                const result = await saveProduct(productData);
                
                if (result.success) {
                    if (result.created) {
                        emitProgress({ scraped: globalProgress.scraped + 1 });
                    } else if (result.skipped) {
                        emitProgress({ skipped: globalProgress.skipped + 1 });
                    }
                } else {
                    emitProgress({ errors: globalProgress.errors + 1 });
                }
            } catch (error) {
                log('error', `Failed to process product: ${productUrl}`, { error: error.message });
                emitProgress({ errors: globalProgress.errors + 1 });
            }
            
            // Introduce a delay between products to avoid overloading the server
            if (i < productsToProcess.length - 1) {
                await sleep(1000);
            }
        }
        
        log('info', 'Scraping completed!');
        emitProgress({ phase: 'Completed' });
    } catch (error) {
        log('error', 'Scraper failed', { error: error.message, stack: error.stack });
        emitProgress({ phase: 'Failed' });
    } finally {
        // Clean up
        if (browser) {
            await browser.close();
        }
        
        // Disconnect from MongoDB
        await mongoose.disconnect();
        log('info', 'Disconnected from MongoDB');
    }
};

// Start the scraper
startScraper().catch(error => {
    log('error', 'Uncaught exception in scraper', { error: error.message, stack: error.stack });
    process.exit(1);
});

// Export the emitter for progress tracking
module.exports = { scraperEmitter };
