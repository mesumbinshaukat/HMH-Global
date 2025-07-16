// Scraper for northwest-cosmetics.com (excluding fragrances)
// Usage: node scrapeNorthwestCosmetics.js

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
        
        // Create a default category for scraped products
        const defaultCategory = await ensureCategory('Northwest Cosmetics');
        
        let scrapedCount = 0;
        let errorCount = 0;
        
        for (const productUrl of productLinksArray) {
            try {
                console.log(`Scraping product ${scrapedCount + 1}/${productLinksArray.length}: ${productUrl}`);
                
                await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(1000);
                
                const productData = await page.evaluate(() => {
                    // Try multiple selectors for product title
                    const title = document.querySelector('h1.product-title')?.textContent?.trim() ||
                                document.querySelector('h1.product__title')?.textContent?.trim() ||
                                document.querySelector('h1')?.textContent?.trim() ||
                                document.querySelector('.product-title')?.textContent?.trim() ||
                                '';
                    
                    // Try multiple selectors for description
                    const description = document.querySelector('.product-description')?.textContent?.trim() ||
                                      document.querySelector('.product__description')?.textContent?.trim() ||
                                      document.querySelector('.product-content')?.textContent?.trim() ||
                                      document.querySelector('.rte')?.textContent?.trim() ||
                                      'No description available';
                    
                    // Try multiple selectors for price
                    const priceElement = document.querySelector('.price')?.textContent ||
                                       document.querySelector('.product-price')?.textContent ||
                                       document.querySelector('.price-item')?.textContent ||
                                       document.querySelector('[data-price]')?.textContent ||
                                       '';
                    
                    const price = parseFloat(priceElement.replace(/[^\d.]/g, '')) || 0;
                    
                    // Try multiple selectors for images
                    const imageElements = document.querySelectorAll('.product-gallery img, .product__media img, .product-image img, .product-photos img');
                    const images = Array.from(imageElements)
                        .map(img => img.src || img.dataset.src)
                        .filter(src => src && !src.includes('placeholder'))
                        .slice(0, 5); // Limit to 5 images
                    
                    return { 
                        name: title, 
                        description: description.substring(0, 1000), // Limit description length
                        price: price, 
                        images: images 
                    };
                });
                
                if (!productData.name || !productData.price || productData.price <= 0) {
                    console.log(`Skipping product with invalid data: ${productUrl}`);
                    errorCount++;
                    continue;
                }
                
                // Filter out fragrance products
                if (productData.name.toLowerCase().includes('fragrance') || 
                    productData.name.toLowerCase().includes('perfume') ||
                    productData.description.toLowerCase().includes('fragrance')) {
                    console.log(`Skipping fragrance product: ${productData.name}`);
                    continue;
                }
                
                // Download images
                const imageUrls = [];
                for (const [i, imgUrl] of productData.images.entries()) {
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
                    } catch (err) {
                        console.error('Failed to download image:', imgUrl, err.message);
                    }
                }
                
                // Generate SKU
                const sku = generateSKU(productData.name);
                
                // Upsert product in DB
                await Product.findOneAndUpdate(
                    { name: productData.name },
                    {
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
                    },
                    { upsert: true, new: true }
                );
                
                console.log(`✓ Saved product: ${productData.name}`);
                scrapedCount++;
                
            } catch (err) {
                console.error(`Error scraping product ${productUrl}:`, err.message);
                errorCount++;
            }
            
            // Add a small delay to avoid overwhelming the server
            await page.waitForTimeout(1000);
        }
        
        console.log(`\n=== Scraping Summary ===`);
        console.log(`Total products found: ${productLinksArray.length}`);
        console.log(`Successfully scraped: ${scrapedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`=========================`);
        
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

module.exports = main;
