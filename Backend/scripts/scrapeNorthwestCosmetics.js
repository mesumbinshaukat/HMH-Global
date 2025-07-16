// Scraper for northwest-cosmetics.com (excluding fragrances)
// Usage: node scrapeNorthwestCosmetics.js

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function downloadImage(url, dest) {
    const https = require('https');
    const file = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://northwest-cosmetics.com/', { waitUntil: 'networkidle2' });

        // Get all category links except fragrances
        const categories = await page.$$eval('.nav-link', links =>
            links.filter(link => !/fragrance/i.test(link.textContent)).map(link => ({
                name: link.textContent.trim(),
                url: link.href
            }))
        );

        for (const category of categories) {
            console.log(`Scraping category: ${category.name}`);
            await page.goto(category.url, { waitUntil: 'networkidle2' });
            // Get product links on the category page
            const productLinks = await page.$$eval('.product-title a', links => links.map(link => link.href));
            for (const productUrl of productLinks) {
                try {
                    await page.goto(productUrl, { waitUntil: 'networkidle2' });
                    const product = await page.evaluate(() => {
                        const name = document.querySelector('h1.product-title')?.textContent?.trim() || '';
                        const description = document.querySelector('.product-description')?.textContent?.trim() || '';
                        const priceText = document.querySelector('.price')?.textContent || '';
                        const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                        const images = Array.from(document.querySelectorAll('.product-gallery img')).map(img => img.src);
                        return { name, description, price, images };
                    });
                    if (!product.name || !product.price) continue;
                    // Download images
                    const imagePaths = [];
                    for (const [i, imgUrl] of product.images.entries()) {
                        const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
                        const fileName = `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${i}${ext}`;
                        const dest = path.join(__dirname, '../uploads/products', fileName);
                        try {
                            await downloadImage(imgUrl, dest);
                            imagePaths.push(`/uploads/products/${fileName}`);
                        } catch (err) {
                            console.error('Failed to download image:', imgUrl, err.message);
                        }
                    }
                    // Upsert product in DB
                    await Product.findOneAndUpdate(
                        { name: product.name },
                        {
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            images: imagePaths,
                            isActive: true
                        },
                        { upsert: true, new: true }
                    );
                    console.log(`Saved product: ${product.name}`);
                } catch (err) {
                    console.error('Error scraping product:', productUrl, err.message);
                }
            }
        }
        await browser.close();
        await mongoose.disconnect();
        console.log('Scraping complete.');
    } catch (err) {
        console.error('Scraper error:', err.message);
        process.exit(1);
    }
    process.exit(0);
}

main(); 