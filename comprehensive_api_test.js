const axios = require('axios');

class APITester {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.token = null;
        this.testUser = null;
        this.testProductId = null;
    }

    async log(message, data = {}) {
        console.log(`[${new Date().toISOString()}] ${message}`, data);
    }

    async testUserRegistration() {
        this.log('🧪 Testing User Registration...');
        try {
            const response = await axios.post(`${this.baseUrl}/api/users/register`, {
                name: 'API Test User',
                email: 'apitest@example.com',
                password: 'testpass123',
                role: 'customer'
            });

            if (response.data.success) {
                this.testUser = response.data.data.user;
                this.token = response.data.data.token;
                this.log('✅ User registration successful', { userId: this.testUser._id });
                return true;
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('already exists')) {
                this.log('ℹ️ User already exists - attempting login...');
                return await this.testUserLogin();
            }
            this.log('❌ User registration failed', { error: error.response?.data || error.message });
        }
        return false;
    }

    async testUserLogin() {
        this.log('🧪 Testing User Login...');
        try {
            const response = await axios.post(`${this.baseUrl}/api/users/login`, {
                email: 'apitest@example.com',
                password: 'testpass123'
            });

            if (response.data.success) {
                this.testUser = response.data.data.user;
                this.token = response.data.data.token;
                this.log('✅ User login successful', { userId: this.testUser._id });
                return true;
            }
        } catch (error) {
            this.log('❌ User login failed', { error: error.response?.data || error.message });
        }
        return false;
    }

    async testProductsAPI() {
        this.log('🧪 Testing Products API...');
        try {
            const response = await axios.get(`${this.baseUrl}/api/products`);
            
            if (response.data.success && response.data.data.data) {
                const products = response.data.data.data;
                this.log('✅ Products API successful', { count: products.length });
                
                if (products.length > 0) {
                    this.testProductId = products[0]._id;
                    this.log('📝 Sample product', { 
                        name: products[0].name, 
                        price: products[0].price,
                        id: this.testProductId 
                    });
                }
                return true;
            }
        } catch (error) {
            this.log('❌ Products API failed', { error: error.response?.data || error.message });
        }
        return false;
    }

    async testCategoriesAPI() {
        this.log('🧪 Testing Categories API...');
        try {
            const response = await axios.get(`${this.baseUrl}/api/categories`);
            
            if (response.data.success && response.data.data) {
                this.log('✅ Categories API successful', { count: response.data.data.length });
                return true;
            }
        } catch (error) {
            this.log('❌ Categories API failed', { error: error.response?.data || error.message });
        }
        return false;
    }

    async testCartAPI() {
        if (!this.token || !this.testProductId) {
            this.log('⚠️ Skipping cart tests - missing token or product');
            return false;
        }

        this.log('🧪 Testing Cart API...');
        
        try {
            // Test add to cart
            const addResponse = await axios.post(`${this.baseUrl}/api/cart/add`, 
                {
                    productId: this.testProductId,
                    quantity: 2
                },
                {
                    headers: { Authorization: `Bearer ${this.token}` }
                }
            );

            if (addResponse.data.success) {
                this.log('✅ Add to cart successful');
                
                // Test get cart
                const getResponse = await axios.get(`${this.baseUrl}/api/cart`, {
                    headers: { Authorization: `Bearer ${this.token}` }
                });

                if (getResponse.data.success) {
                    this.log('✅ Get cart successful', { 
                        items: getResponse.data.data.items?.length || 0 
                    });
                    
                    // Test update cart
                    const updateResponse = await axios.put(`${this.baseUrl}/api/cart/update`,
                        {
                            productId: this.testProductId,
                            quantity: 3
                        },
                        {
                            headers: { Authorization: `Bearer ${this.token}` }
                        }
                    );

                    if (updateResponse.data.success) {
                        this.log('✅ Update cart successful');
                        
                        // Test remove from cart
                        const removeResponse = await axios.delete(
                            `${this.baseUrl}/api/cart/remove/${this.testProductId}`,
                            {
                                headers: { Authorization: `Bearer ${this.token}` }
                            }
                        );

                        if (removeResponse.data.success) {
                            this.log('✅ Remove from cart successful');
                            return true;
                        }
                    }
                }
            }
        } catch (error) {
            this.log('❌ Cart API failed', { error: error.response?.data || error.message });
        }
        return false;
    }

    async testGuestCartAPI() {
        this.log('🧪 Testing Guest Cart API...');
        
        if (!this.testProductId) {
            this.log('⚠️ Skipping guest cart tests - no test product');
            return false;
        }

        try {
            // Test guest add to cart (no auth)
            const addResponse = await axios.post(`${this.baseUrl}/api/cart/add`, {
                productId: this.testProductId,
                quantity: 1
            });

            if (addResponse.data.success) {
                this.log('✅ Guest add to cart successful');
                
                // Test guest get cart
                const getResponse = await axios.get(`${this.baseUrl}/api/cart`);

                if (getResponse.data.success) {
                    this.log('✅ Guest get cart successful');
                    return true;
                }
            }
        } catch (error) {
            this.log('❌ Guest cart API failed', { error: error.response?.data || error.message });
        }
        return false;
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive API Tests...');
        
        const results = {
            userRegistration: await this.testUserRegistration(),
            products: await this.testProductsAPI(),
            categories: await this.testCategoriesAPI(),
            cart: await this.testCartAPI(),
            guestCart: await this.testGuestCartAPI()
        };

        const passed = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;

        this.log('📊 Test Results Summary', {
            passed: `${passed}/${total}`,
            success_rate: `${Math.round((passed/total) * 100)}%`,
            details: results
        });

        if (passed === total) {
            this.log('🎉 All tests passed! API is fully functional.');
        } else {
            this.log('⚠️ Some tests failed. Check logs above for details.');
        }

        return results;
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = APITester;
