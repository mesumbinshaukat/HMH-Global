// HMH Global Production Verification Script
// This script tests all key API endpoints and database functionality

const axios = require('axios');

const BASE_URL = 'https://hmhglobal.co.uk/api';

class ProductionVerifier {
    constructor() {
        this.results = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    async runTest(name, testFn) {
        this.totalTests++;
        console.log(`\n🧪 Testing: ${name}`);
        
        try {
            const result = await testFn();
            if (result.success) {
                console.log(`✅ PASS: ${name} - ${result.message}`);
                this.passedTests++;
                this.results.push({ name, status: 'PASS', message: result.message });
            } else {
                console.log(`❌ FAIL: ${name} - ${result.message}`);
                this.results.push({ name, status: 'FAIL', message: result.message });
            }
        } catch (error) {
            console.log(`❌ ERROR: ${name} - ${error.message}`);
            this.results.push({ name, status: 'ERROR', message: error.message });
        }
    }

    async testCategoriesEndpoint() {
        return this.runTest('Categories API', async () => {
            const response = await axios.get(`${BASE_URL}/categories`);
            const data = response.data;
            
            if (!data.success) {
                return { success: false, message: 'API returned success: false' };
            }
            
            if (!Array.isArray(data.data)) {
                return { success: false, message: 'Data is not an array' };
            }
            
            if (data.data.length === 0) {
                return { success: false, message: 'No categories found' };
            }
            
            return { 
                success: true, 
                message: `Found ${data.data.length} categories` 
            };
        });
    }

    async testProductsEndpoint() {
        return this.runTest('Products API', async () => {
            const response = await axios.get(`${BASE_URL}/products`);
            const data = response.data;
            
            if (!data.success) {
                return { success: false, message: 'API returned success: false' };
            }
            
            if (!data.data || !data.data.data) {
                return { success: false, message: 'Invalid data structure' };
            }
            
            if (!Array.isArray(data.data.data)) {
                return { success: false, message: 'Products data is not an array' };
            }
            
            if (data.data.data.length === 0) {
                return { success: false, message: 'No products found' };
            }
            
            return { 
                success: true, 
                message: `Found ${data.data.pagination.total} products (showing ${data.data.data.length})` 
            };
        });
    }

    async testFeaturedProductsEndpoint() {
        return this.runTest('Featured Products API', async () => {
            const response = await axios.get(`${BASE_URL}/products/featured`);
            const data = response.data;
            
            if (!data.success) {
                return { success: false, message: 'API returned success: false' };
            }
            
            return { 
                success: true, 
                message: `Found ${data.data.length} featured products` 
            };
        });
    }

    async testProductSearch() {
        return this.runTest('Product Search API', async () => {
            const response = await axios.get(`${BASE_URL}/products/search?q=eyeliner`);
            const data = response.data;
            
            if (!data.success) {
                return { success: false, message: 'API returned success: false' };
            }
            
            return { 
                success: true, 
                message: `Search returned ${data.data.pagination.total} results for 'eyeliner'` 
            };
        });
    }

    async testSpecificProduct() {
        return this.runTest('Specific Product API', async () => {
            // First get products list to get a valid ID
            const productsResponse = await axios.get(`${BASE_URL}/products`);
            const products = productsResponse.data.data.data;
            
            if (products.length === 0) {
                return { success: false, message: 'No products available to test' };
            }
            
            const productId = products[0]._id;
            const response = await axios.get(`${BASE_URL}/products/${productId}`);
            const data = response.data;
            
            if (!data.success) {
                return { success: false, message: 'API returned success: false' };
            }
            
            if (!data.data.name || !data.data.price) {
                return { success: false, message: 'Product missing essential data' };
            }
            
            return { 
                success: true, 
                message: `Retrieved product: ${data.data.name} (£${data.data.price})` 
            };
        });
    }

    async testDataQuality() {
        return this.runTest('Data Quality Check', async () => {
            const [categoriesResponse, productsResponse] = await Promise.all([
                axios.get(`${BASE_URL}/categories`),
                axios.get(`${BASE_URL}/products`)
            ]);
            
            const categories = categoriesResponse.data.data;
            const products = productsResponse.data.data.data;
            
            // Check if we have reasonable amounts of data
            if (categories.length < 10) {
                return { success: false, message: `Too few categories: ${categories.length}` };
            }
            
            if (products.length === 0) {
                return { success: false, message: 'No products found' };
            }
            
            // Check data integrity
            const productsWithCategories = products.filter(p => p.category);
            const productsWithPrices = products.filter(p => p.price > 0);
            const activeProducts = products.filter(p => p.isActive);
            
            return { 
                success: true, 
                message: `Quality: ${categories.length} categories, ${products.length} products, ${productsWithCategories.length} with categories, ${productsWithPrices.length} with prices, ${activeProducts.length} active` 
            };
        });
    }

    async testWebsiteAccess() {
        return this.runTest('Website Access', async () => {
            const response = await axios.get('https://hmhglobal.co.uk');
            
            if (response.status !== 200) {
                return { success: false, message: `HTTP ${response.status}` };
            }
            
            if (!response.data.includes('HMH Global')) {
                return { success: false, message: 'Website content missing title' };
            }
            
            return { 
                success: true, 
                message: 'Website loads successfully with correct title' 
            };
        });
    }

    async runAllTests() {
        console.log('🚀 Starting HMH Global Production Verification\n');
        console.log('=' .repeat(60));
        
        await this.testWebsiteAccess();
        await this.testCategoriesEndpoint();
        await this.testProductsEndpoint();
        await this.testFeaturedProductsEndpoint();
        await this.testProductSearch();
        await this.testSpecificProduct();
        await this.testDataQuality();
        
        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('=' .repeat(60));
        
        const failedTests = this.results.filter(r => r.status !== 'PASS');
        
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests}`);
        console.log(`Failed: ${this.totalTests - this.passedTests}`);
        console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
        
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`  - ${test.name}: ${test.message}`);
            });
        }
        
        if (this.passedTests === this.totalTests) {
            console.log('\n🎉 ALL TESTS PASSED! HMH Global is fully operational! 🎉');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the issues above.');
        }
        
        console.log('\n✨ Production verification complete!');
    }
}

// Run the verification
async function main() {
    const verifier = new ProductionVerifier();
    await verifier.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ProductionVerifier;
