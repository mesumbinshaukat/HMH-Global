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
            '--single-process'
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
            const bodyText = document.body.textContent || '';
            const priceMatches = [
                bodyText.match(/[£$]\s?(\d+(?:\.\d{1,2})?)/),
                bodyText.match(/(\d+(?:\.\d{1,2})?\s?[£$])/),
                bodyText.match(/Price[:\s]*[£$]?\s*(\d+(?:\.\d{1,2})?)/i),
                bodyText.match(/Cost[:\s]*[£$]?\s*(\d+(?:\.\d{1,2})?)/i)
            ];
            
            for (const match of priceMatches) {
                if (match && parseFloat(match[1]) > 0) {
                    price = parseFloat(match[1]);
                    break;
                }
            }
        }

        // Enhanced image extraction for Northwest Cosmetics
        let images = [];
        const imageSelectors = [
            '#_EKM_PRODUCTIMAGE_1_2',
            '#_EKM_PRODUCTIMAGE_2_2',
            '#_EKM_PRODUCTIMAGE_3_2',
            '#_EKM_PRODUCTIMAGE_4_2',
            '#_EKM_PRODUCTIMAGE_5_2',
            '.main-prod-image img',
            '.product-image img',
            '.product__media img',
            '.product-gallery img',
            '.main-image img',
            '.featured-image img',
            '.product-photos img',
            'img[itemprop="image"]',
            'img[src*="ekmcdn.com"]',
            'img[src*="product"]',
            'img[alt*="product"]'
        ];
        
        // Get main product images
        for (const selector of imageSelectors) {
            const imgs = document.querySelectorAll(selector);
            for (const img of imgs) {
                if (img.src && 
                    img.src.startsWith('http') &&
                    !img.src.includes('placeholder') && 
                    !img.src.includes('loading') &&
                    !img.src.includes('spinner') &&
                    !img.src.includes('logo') &&
                    !img.src.includes('//:0') &&
                    (img.width > 50 || img.naturalWidth > 50) && 
                    (img.height > 50 || img.naturalHeight > 50)) {
                    images.push(img.src);
                }
            }
        }
        
        // Get additional gallery images
        const allImages = document.querySelectorAll('img');
        for (const img of allImages) {
            if (img.src && 
                img.src.startsWith('http') &&
                !images.includes(img.src) &&
                !img.src.includes('placeholder') &&
                !img.src.includes('loading') &&
                !img.src.includes('icon') &&
                !img.src.includes('logo') &&
                !img.src.includes('button') &&
                !img.src.includes('arrow') &&
                !img.src.includes('//:0') &&
                (img.width > 100 || img.naturalWidth > 100 || img.height > 100 || img.naturalHeight > 100) &&
                (img.src.includes('ekmcdn.com') || img.src.includes('product') || img.src.includes('item') || img.alt?.toLowerCase().includes('product'))) {
                images.push(img.src);
            }
        }
        
        // Clean and limit images
        images = [...new Set(images)]
            .filter(url => /^https?:\/\//.test(url) && !url.includes('//:0'))
            .slice(0, 5);

        // Enhanced brand extraction
        let brand = 'Northwest Cosmetics';
        const brandSelectors = [
            '.brand',
            '.manufacturer',
            '.product-brand',
            '[data-brand]',
            '.brand-name',
            '.maker'
        ];
        
        for (const selector of brandSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent && el.textContent.trim()) {
                brand = el.textContent.trim();
                break;
            }
        }

        // Extract specifications
        const specifications = {};
        const specSelectors = [
            'table tr',
            '.specs li',
            '.specifications li',
            '.product-info li',
            '.product-details li',
            '.attributes li'
        ];
        
        for (const selector of specSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.textContent || '';
                if (text.includes(':')) {
                    const [key, value] = text.split(':').map(s => s.trim());
                    if (key && value && key.length < 50 && value.length < 200) {
                        specifications[key] = value;
                    }
                }
            }
        }

        return { 
            name: name.substring(0, 200), 
            description: description.substring(0, 1000), 
            price, 
            images, 
            specifications,
            brand: brand.substring(0, 100)
        };
    });
};

// Enhanced product processing with Excel integration
const processProduct = async (page, productUrl, category) => {
    let retries = 0;
    
    while (retries < CONFIG.MAX_RETRIES) {
        try {
            await page.goto(productUrl, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            await sleep(1000);

            const productData = await extractProductData(page);
            
            if (!productData || !productData.name || productData.name.length < 2) {
                throw new Error('Invalid product data extracted');
            }
            
            // Check for fragrance products
            const isFragrance = CONFIG.EXCLUDED_KEYWORDS.some(keyword => 
                productData.name.toLowerCase().includes(keyword) ||
                productData.description.toLowerCase().includes(keyword)
            );
            
            if (isFragrance) {
                log('info', `Skipping fragrance product: ${productData.name}`);
                return { status: 'skipped', reason: 'fragrance' };
            }
            
            // Check Excel for price data
            const excelPrice = priceData.get(productData.name.toLowerCase().trim());
            if (excelPrice) {
                productData.price = excelPrice.finalPrice;
                productData.originalPrice = excelPrice.originalPrice;
                productData.brand = excelPrice.brand || productData.brand;
                log('info', `Using Excel price for ${productData.name}: £${excelPrice.finalPrice}`);
            } else if (productData.price > 0) {
                // Add markup to scraped price
                productData.originalPrice = productData.price;
                productData.price = productData.price + CONFIG.PRICE_MARKUP;
            } else {
                throw new Error('No valid price found');
            }
            
            // Check for existing product
            const existingProduct = await Product.findOne({
                $or: [
                    { name: productData.name },
                    { 'metadata.sourceUrl': productUrl }
                ]
            });
            
            if (existingProduct && !CONFIG.UPDATE_IMAGES) {
                log('info', `Product already exists: ${productData.name}`);
                return { status: 'skipped', reason: 'exists' };
            }
            
            // Filter and validate images
            if (!productData.images || productData.images.length === 0) {
                throw new Error('No valid images found');
            }
            
            // Download images to organized folders
            const imageUrls = [];
            for (let i = 0; i < Math.min(productData.images.length, CONFIG.MAX_IMAGES_PER_PRODUCT); i++) {
                try {
                    const imageResult = await downloadImage(productData.images[i], productData.name, i);
                    imageUrls.push(imageResult);
                } catch (imgError) {
                    log('warning', `Failed to download image ${i} for ${productData.name}`, { error: imgError.message });
                }
            }
            
            if (imageUrls.length === 0) {
                throw new Error('Failed to download any images');
            }
            
            // Generate unique SKU
            const sku = `NWC-${sanitizeFileName(productData.name)}-${Date.now()}`.toUpperCase();
            
            // Create or update product
            const productDoc = {
                name: productData.name,
                description: productData.description,
                shortDescription: productData.description.substring(0, 200),
                price: productData.price,
                sku: sku,
                category: category._id,
                brand: productData.brand,
                images: imageUrls,
                inventory: {
                    quantity: 100,
                    trackQuantity: true,
                    lowStockThreshold: 10
                },
                isActive: true,
                isFeatured: Math.random() < 0.1, // 10% chance of being featured
                metadata: {
                    sourceUrl: productUrl,
                    scrapedAt: new Date(),
                    specifications: productData.specifications,
                    originalBrand: productData.brand,
                    originalPrice: productData.originalPrice,
                    priceMarkup: CONFIG.PRICE_MARKUP,
                    version: '2.0'
                }
            };
            
            if (existingProduct) {
                // Update existing product
                Object.assign(existingProduct, productDoc);
                await existingProduct.save();
                log('info', `Updated product: ${productData.name}`);
                return { status: 'updated', product: existingProduct };
            } else {
                // Create new product
                const product = new Product(productDoc);
                const savedProduct = await product.save();
                log('info', `Created product: ${productData.name} (${savedProduct._id})`);
                return { status: 'created', product: savedProduct };
            }
            
        } catch (error) {
            retries++;
            log('warning', `Retry ${retries}/${CONFIG.MAX_RETRIES} for product: ${productUrl}`, { error: error.message });
            
            if (retries >= CONFIG.MAX_RETRIES) {
                log('error', `Failed to process product after ${CONFIG.MAX_RETRIES} retries: ${productUrl}`, { error: error.message });
                return { status: 'error', error: error.message };
            }
            
            await sleep(CONFIG.RETRY_DELAY * retries);
        }
    }
};

// Main scraping function
const main = async () => {
    let browser;
    
    try {
        log('info', 'Starting Enhanced Northwest Cosmetics Scraper v2.0');
        
        if (CONFIG.TEST_MODE) {
            log('info', 'Running in TEST MODE - Limited scraping');
        }
        
        // Initialize progress
        emitProgress({ phase: 'Initializing', current: 0 });
        
        // Load Excel prices
        await loadExcelPrices();
        
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        log('info', 'Connected to MongoDB');
        
        // Launch browser
        browser = await puppeteer.launch(CONFIG.BROWSER_CONFIG);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        emitProgress({ phase: 'Loading sitemap' });
        
        // Load sitemap with retries
        let sitemapContent = '';
        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                log('info', `Loading sitemap attempt ${attempt}/${CONFIG.MAX_RETRIES}`);
                await page.goto('https://northwest-cosmetics.com/sitemap.asp', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 30000 
                });
                await sleep(3000);
                sitemapContent = await page.content();
                
                if (sitemapContent.length > 1000) {
                    log('info', `Sitemap loaded successfully (${sitemapContent.length} chars)`);
                    break;
                }
            } catch (error) {
                log('warning', `Sitemap attempt ${attempt} failed`, { error: error.message });
                if (attempt === CONFIG.MAX_RETRIES) {
                    throw new Error('Failed to load sitemap after all retries');
                }
                await sleep(CONFIG.RETRY_DELAY * attempt);
            }
        }
        
        // Extract category links
        const categoryLinks = extractCategoryLinks(sitemapContent);
        log('info', `Found ${categoryLinks.length} category links`);
        
        if (CONFIG.TEST_MODE) {
            categoryLinks.splice(2); // Limit to first 2 categories in test mode
            log('info', `Test mode: Limited to ${categoryLinks.length} categories`);
        }
        
        emitProgress({ phase: 'Processing categories', categories: categoryLinks.length });
        
        // Process categories
        let stats = {
            processed: 0,
            created: 0,
            updated: 0, 
            skipped: 0,
            errors: 0
        };
        
        for (const [categoryIndex, categoryUrl] of categoryLinks.entries()) {
            try {
                log('info', `Processing category ${categoryIndex + 1}/${categoryLinks.length}: ${categoryUrl}`);
                
                // Create category
                const categoryName = categoryUrl.split('/').pop()
                    .replace('-c.asp', '')
                    .replace(/-/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                
                const category = await ensureCategory(categoryName);
                
                // Load category page
                await page.goto(categoryUrl, { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 30000 
                });
                await sleep(2000);
                
                const categoryContent = await page.content();
                const productLinks = extractProductLinks(categoryContent);
                
                log('info', `Found ${productLinks.length} products in ${categoryName}`);
                
                if (CONFIG.TEST_MODE && CONFIG.PRODUCT_LIMIT) {
                    productLinks.splice(parseInt(CONFIG.PRODUCT_LIMIT));
                }
                
                // Process products in this category
                for (const [productIndex, productUrl] of productLinks.entries()) {
                    try {
                        emitProgress({ 
                            current: stats.processed + 1,
                            url: productUrl,
                            phase: `Processing ${categoryName} (${productIndex + 1}/${productLinks.length})`
                        });
                        
                        const result = await processProduct(page, productUrl, category);
                        
                        switch (result.status) {
                            case 'created':
                                stats.created++;
                                break;
                            case 'updated':
                                stats.updated++;
                                break;
                            case 'skipped':
                                stats.skipped++;
                                break;
                            case 'error':
                                stats.errors++;
                                break;
                        }
                        
                        stats.processed++;
                        
                        // Small delay between products
                        await sleep(1000);
                        
                    } catch (productError) {
                        log('error', `Failed to process product: ${productUrl}`, { error: productError.message });
                        stats.errors++;
                    }
                }
                
                log('info', `Completed category ${categoryName}: ${productLinks.length} products processed`);
                
            } catch (categoryError) {
                log('error', `Failed to process category: ${categoryUrl}`, { error: categoryError.message });
                stats.errors++;
            }
        }
        
        // Final summary
        log('info', 'Scraping completed!', stats);
        emitProgress({ 
            phase: 'Completed',
            ...stats
        });
        
        scraperEmitter.emit('finish', stats);
        
    } catch (error) {
        log('error', 'Scraper failed', { error: error.message, stack: error.stack });
        scraperEmitter.emit('error', error);
    } finally {
        if (browser) {
            await browser.close();
        }
        await mongoose.disconnect();
        log('info', 'Scraper shutdown complete');
    }
};

// Export for external use
module.exports = { main, scraperEmitter, CONFIG };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
