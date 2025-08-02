// Comprehensive HMH Global E-commerce System Test Suite
// Tests all components: Database, API, Frontend, Images, Categories, Products
// Usage: node testSuite.js [--full] [--api-only] [--frontend-only]
// Author: HMH Global Development Team

const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Test Configuration
const CONFIG = {
    API_BASE_URL: 'https://hmhglobal.co.uk/api',
    FRONTEND_URL: 'https://hmhglobal.co.uk',
    LOCAL_API_URL: 'http://localhost:5000/api',
    MONGO_URI: process.env.MONGO_URI,
    TEST_TIMEOUT: 10000,
    FULL_TEST: process.argv.includes('--full'),
    API_ONLY: process.argv.includes('--api-only'),
    FRONTEND_ONLY: process.argv.includes('--frontend-only')
};

// Test Results Tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    startTime: new Date(),
    endTime: null
};

// Utility Functions
const log = (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const colors = {
        INFO: '\x1b[36m',    // Cyan
        SUCCESS: '\x1b[32m',  // Green
        WARNING: '\x1b[33m',  // Yellow
        ERROR: '\x1b[31m',    // Red
        RESET: '\x1b[0m'      // Reset
    };
    
    console.log(`${colors[level] || colors.INFO}[${timestamp}] [${level}] ${message}${colors.RESET}`, data);
};

const runTest = async (testName, testFunction) => {
    testResults.total++;
    try {
        log('INFO', `Running test: ${testName}`);
        const result = await testFunction();
        
        if (result === true || (typeof result === 'object' && result.success)) {
            testResults.passed++;
            log('SUCCESS', `✓ ${testName} - PASSED`);
            return true;
        } else {
            throw new Error(result.error || 'Test returned false or invalid result');
        }
    } catch (error) {
        testResults.failed++;
        testResults.errors.push({ test: testName, error: error.message });
        log('ERROR', `✗ ${testName} - FAILED`, { error: error.message });
        return false;
    }
};

// Database Tests
const testDatabaseConnection = async () => {
    try {
        await mongoose.connect(CONFIG.MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        await mongoose.disconnect();
        
        const requiredCollections = ['products', 'categories'];
        const optionalCollections = ['users', 'orders', 'reviews'];
        const existingCollections = collections.map(c => c.name);
        const missingRequired = requiredCollections.filter(req => !existingCollections.includes(req));
        
        if (missingRequired.length > 0) {
            throw new Error(`Missing required collections: ${missingRequired.join(', ')}`);
        }
        
        return { success: true, collections: existingCollections.length };
    } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
    }
};

const testDatabaseContent = async () => {
    try {
        await mongoose.connect(CONFIG.MONGO_URI);
        
        const productsCount = await mongoose.connection.db.collection('products').countDocuments();
        const categoriesCount = await mongoose.connection.db.collection('categories').countDocuments();
        
        await mongoose.disconnect();
        
        if (productsCount === 0) {
            throw new Error('No products found in database');
        }
        
        if (categoriesCount === 0) {
            throw new Error('No categories found in database');
        }
        
        return { 
            success: true, 
            products: productsCount, 
            categories: categoriesCount 
        };
    } catch (error) {
        throw new Error(`Database content test failed: ${error.message}`);
    }
};

// API Tests
const testAPIHealth = async () => {
    try {
        const response = await axios.get(`${CONFIG.API_BASE_URL}/products?limit=1`, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        if (response.status !== 200) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        if (!response.data.success) {
            throw new Error('API response indicates failure');
        }
        
        return { success: true, responseTime: response.headers['x-response-time'] };
    } catch (error) {
        throw new Error(`API health check failed: ${error.message}`);
    }
};

const testAPIEndpoints = async () => {
    const endpoints = [
        { path: '/products', method: 'GET', expectedFields: ['data', 'pagination'] },
        { path: '/categories', method: 'GET', expectedFields: ['data'] },
        { path: '/products?search=laval', method: 'GET', expectedFields: ['data', 'pagination'] },
        { path: '/products?category=688d70afafac58c8f901dbbb', method: 'GET', expectedFields: ['data', 'pagination'] }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios({
                method: endpoint.method,
                url: `${CONFIG.API_BASE_URL}${endpoint.path}`,
                timeout: CONFIG.TEST_TIMEOUT
            });
            
            if (response.status !== 200 || !response.data.success) {
                throw new Error(`Endpoint ${endpoint.path} failed`);
            }
            
            // Check required fields
            for (const field of endpoint.expectedFields) {
                if (field === 'data' && !response.data.data) {
                    throw new Error(`Missing field: data`);
                } else if (field === 'pagination' && !response.data.data.pagination) {
                    throw new Error(`Missing field: pagination`);
                } else if (field !== 'data' && field !== 'pagination' && !(field in response.data)) {
                    throw new Error(`Missing field: ${field}`);
                }
            }
            
            results.push({ endpoint: endpoint.path, status: 'PASSED' });
        } catch (error) {
            results.push({ endpoint: endpoint.path, status: 'FAILED', error: error.message });
        }
    }
    
    const failedTests = results.filter(r => r.status === 'FAILED');
    if (failedTests.length > 0) {
        throw new Error(`${failedTests.length} API endpoints failed: ${failedTests.map(f => f.endpoint).join(', ')}`);
    }
    
    return { success: true, endpoints: results.length };
};

const testProductData = async () => {
    try {
        const response = await axios.get(`${CONFIG.API_BASE_URL}/products?limit=5`, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        const products = response.data.data.data;
        if (!products || products.length === 0) {
            throw new Error('No products returned');
        }
        
        // Test product structure
        const requiredFields = ['_id', 'name', 'price', 'category', 'images', 'inventory'];
        const issues = [];
        
        products.forEach((product, index) => {
            requiredFields.forEach(field => {
                if (!(field in product)) {
                    issues.push(`Product ${index}: Missing field ${field}`);
                }
            });
            
            // Test specific field formats
            if (product.price && (typeof product.price !== 'number' || product.price <= 0)) {
                issues.push(`Product ${index}: Invalid price ${product.price}`);
            }
            
            if (product.images && (!Array.isArray(product.images) || product.images.length === 0)) {
                issues.push(`Product ${index}: Invalid or empty images array`);
            }
        });
        
        if (issues.length > 0) {
            throw new Error(`Product data issues: ${issues.join(', ')}`);
        }
        
        return { success: true, productsChecked: products.length };
    } catch (error) {
        throw new Error(`Product data test failed: ${error.message}`);
    }
};

// Frontend Tests
const testFrontendAccessibility = async () => {
    try {
        const response = await axios.get(CONFIG.FRONTEND_URL, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        if (response.status !== 200) {
            throw new Error(`Frontend returned status ${response.status}`);
        }
        
        const html = response.data;
        const requiredElements = [
            '<div id="root">',
            'HMH Global',
            '<title>',
            '<meta name="description"'
        ];
        
        const missingElements = requiredElements.filter(element => !html.includes(element));
        if (missingElements.length > 0) {
            throw new Error(`Missing HTML elements: ${missingElements.join(', ')}`);
        }
        
        return { success: true, htmlLength: html.length };
    } catch (error) {
        throw new Error(`Frontend accessibility test failed: ${error.message}`);
    }
};

const testStaticAssets = async () => {
    const assets = [
        '/static/css/main.27330cb7.css',
        '/static/js/main.e4a943ea.js',
        '/favicon.ico',
        '/logo.jpeg'
    ];
    
    const results = [];
    
    for (const asset of assets) {
        try {
            const response = await axios.head(`${CONFIG.FRONTEND_URL}${asset}`, {
                timeout: CONFIG.TEST_TIMEOUT
            });
            
            if (response.status !== 200) {
                throw new Error(`Asset returned status ${response.status}`);
            }
            
            results.push({ asset, status: 'PASSED', size: response.headers['content-length'] });
        } catch (error) {
            results.push({ asset, status: 'FAILED', error: error.message });
        }
    }
    
    const failedAssets = results.filter(r => r.status === 'FAILED');
    if (failedAssets.length > 0) {
        throw new Error(`${failedAssets.length} assets failed to load`);
    }
    
    return { success: true, assets: results.length };
};

const testImageAccessibility = async () => {
    try {
        // Get a product with images
        const response = await axios.get(`${CONFIG.API_BASE_URL}/products?limit=5`, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        const products = response.data.data.data;
        const productsWithImages = products.filter(p => p.images && p.images.length > 0);
        
        if (productsWithImages.length === 0) {
            throw new Error('No products with images found for testing');
        }
        
        // Test first few images
        const imagesToTest = productsWithImages.slice(0, 3);
        const imageResults = [];
        
        for (const product of imagesToTest) {
            const imageUrl = `${CONFIG.FRONTEND_URL}${product.images[0]}`;
            
            try {
                const imgResponse = await axios.head(imageUrl, { timeout: CONFIG.TEST_TIMEOUT });
                
                if (imgResponse.status !== 200) {
                    throw new Error(`Image returned status ${imgResponse.status}`);
                }
                
                const contentType = imgResponse.headers['content-type'];
                if (!contentType || !contentType.startsWith('image/')) {
                    throw new Error(`Invalid content type: ${contentType}`);
                }
                
                imageResults.push({ 
                    product: product.name, 
                    status: 'PASSED', 
                    size: imgResponse.headers['content-length'],
                    type: contentType
                });
            } catch (error) {
                imageResults.push({ 
                    product: product.name, 
                    status: 'FAILED', 
                    error: error.message 
                });
            }
        }
        
        const failedImages = imageResults.filter(r => r.status === 'FAILED');
        if (failedImages.length > 0) {
            throw new Error(`${failedImages.length} images failed accessibility test`);
        }
        
        return { success: true, imagesChecked: imageResults.length };
    } catch (error) {
        throw new Error(`Image accessibility test failed: ${error.message}`);
    }
};

// Category and Search Tests
const testCategoriesAndSearch = async () => {
    try {
        // Test categories endpoint
        const categoriesResponse = await axios.get(`${CONFIG.API_BASE_URL}/categories`, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        if (!categoriesResponse.data.success || !categoriesResponse.data.data) {
            throw new Error('Categories endpoint failed');
        }
        
        const categories = categoriesResponse.data.data;
        if (categories.length === 0) {
            throw new Error('No categories found');
        }
        
        // Test category filtering
        const firstCategory = categories[0];
        const categoryResponse = await axios.get(`${CONFIG.API_BASE_URL}/products?category=${firstCategory._id}`, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        if (!categoryResponse.data.success) {
            throw new Error('Category filtering failed');
        }
        
        // Test search functionality
        const searchResponse = await axios.get(`${CONFIG.API_BASE_URL}/products?search=laval`, {
            timeout: CONFIG.TEST_TIMEOUT
        });
        
        if (!searchResponse.data.success) {
            throw new Error('Search functionality failed');
        }
        
        return { 
            success: true, 
            categories: categories.length,
            categoryProducts: categoryResponse.data.data.pagination.total,
            searchResults: searchResponse.data.data.pagination.total
        };
    } catch (error) {
        throw new Error(`Categories and search test failed: ${error.message}`);
    }
};

// Performance Tests
const testAPIPerformance = async () => {
    const tests = [
        { name: 'Products List', url: `${CONFIG.API_BASE_URL}/products?limit=12` },
        { name: 'Categories', url: `${CONFIG.API_BASE_URL}/categories` },
        { name: 'Search', url: `${CONFIG.API_BASE_URL}/products?search=eyeliner` }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const startTime = Date.now();
        try {
            const response = await axios.get(test.url, { timeout: CONFIG.TEST_TIMEOUT });
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            if (response.status !== 200) {
                throw new Error(`Status ${response.status}`);
            }
            
            results.push({
                test: test.name,
                responseTime,
                status: 'PASSED'
            });
        } catch (error) {
            results.push({
                test: test.name,
                status: 'FAILED',
                error: error.message
            });
        }
    }
    
    const failedTests = results.filter(r => r.status === 'FAILED');
    if (failedTests.length > 0) {
        throw new Error(`Performance tests failed: ${failedTests.map(f => f.test).join(', ')}`);
    }
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    if (avgResponseTime > 2000) {
        throw new Error(`Average response time too high: ${avgResponseTime}ms`);
    }
    
    return { success: true, averageResponseTime: avgResponseTime, tests: results.length };
};

// Main Test Runner
const runAllTests = async () => {
    log('INFO', '🚀 Starting HMH Global E-commerce System Test Suite');
    log('INFO', `Configuration: API=${CONFIG.API_BASE_URL}, Frontend=${CONFIG.FRONTEND_URL}`);
    
    try {
        // Database Tests
        if (!CONFIG.FRONTEND_ONLY) {
            log('INFO', '📊 Running Database Tests...');
            await runTest('Database Connection', testDatabaseConnection);
            await runTest('Database Content Validation', testDatabaseContent);
        }
        
        // API Tests  
        if (!CONFIG.FRONTEND_ONLY) {
            log('INFO', '🔌 Running API Tests...');
            await runTest('API Health Check', testAPIHealth);
            await runTest('API Endpoints Functionality', testAPIEndpoints);
            await runTest('Product Data Integrity', testProductData);
            await runTest('Categories and Search', testCategoriesAndSearch);
            
            if (CONFIG.FULL_TEST) {
                await runTest('API Performance', testAPIPerformance);
            }
        }
        
        // Frontend Tests
        if (!CONFIG.API_ONLY) {
            log('INFO', '🎨 Running Frontend Tests...');
            await runTest('Frontend Accessibility', testFrontendAccessibility);
            await runTest('Static Assets Loading', testStaticAssets);
            await runTest('Image Accessibility', testImageAccessibility);
        }
        
    } catch (error) {
        log('ERROR', 'Test suite encountered an unexpected error', { error: error.message });
    }
    
    // Generate Report
    testResults.endTime = new Date();
    const duration = (testResults.endTime - testResults.startTime) / 1000;
    
    log('INFO', '📋 Test Suite Complete - Generating Report...');
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 HMH GLOBAL E-COMMERCE SYSTEM TEST REPORT');
    console.log('='.repeat(80));
    console.log(`📅 Test Date: ${testResults.startTime.toISOString()}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`✅ Total Tests: ${testResults.total}`);
    console.log(`🟢 Passed: ${testResults.passed}`);
    console.log(`🔴 Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.test}: ${error.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (testResults.failed === 0) {
        log('SUCCESS', '🎉 All tests passed! System is fully operational.');
        process.exit(0);
    } else {
        log('WARNING', `⚠️  ${testResults.failed} tests failed. Please review and fix issues.`);
        process.exit(1);
    }
};

// Export for external use
module.exports = { runAllTests, testResults };

// Run if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}
