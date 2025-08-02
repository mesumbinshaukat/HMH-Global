import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useFeaturedProducts, useCategories } from '../hooks/useQuery'
import { formatPrice } from '../lib/utils'
import { Badge } from '../components/ui/badge'
import { Category, Product } from '../types'
import { ChevronRight, ArrowRight, Star, Zap, Shield, Truck, Sparkles, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Heart } from 'lucide-react'
import logo from '../logo.jpeg'

const HomePage: React.FC = () => {
  const { data: featuredProducts, isLoading: loadingProducts } = useFeaturedProducts()
  const { data: categories, isLoading: loadingCategories } = useCategories()

  // Use correct backend response structure
  const featured = featuredProducts?.data || []
  const categoryList = categories?.data || []

  // Interactive state
  const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  // Scroll-triggered animations
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll('.fade-in-up')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-hmh-gold-500/10 rounded-full blur-3xl animate-pulse-gold"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-hmh-gold-400/10 rounded-full blur-3xl animate-pulse-gold" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hmh-gold-300/5 rounded-full blur-3xl animate-float"></div>
          
          {/* Nike-style geometric elements */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-hmh-gold-500/20 rotate-45 animate-float-nike"></div>
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border border-hmh-gold-400/30 rotate-12 animate-float-nike" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-2/3 right-1/3 w-16 h-16 border border-hmh-gold-600/25 rotate-90 animate-float-nike" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Enhanced Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSI3IiBjeT0iNyIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Enhanced Logo Animation */}
          <div className="mb-12 flex justify-center animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-hmh-gold-400 to-hmh-gold-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 p-6 rounded-3xl shadow-premium-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <img src={logo} alt="HMH Global" className="h-24 w-auto" />
                <div className="absolute inset-0 bg-gradient-to-br from-hmh-gold-400/20 to-hmh-gold-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Main Headline */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-responsive-lg font-black text-white mb-6 tracking-tight leading-none">
              <span className="block text-reveal">UNLEASH</span>
              <span className="block bg-gradient-to-r from-hmh-gold-400 via-hmh-gold-500 to-hmh-gold-600 bg-clip-text text-transparent animate-pulse-gold">
                YOUR STYLE
              </span>
            </h1>
          </div>
          
          {/* Enhanced Subtitle */}
          <div className="mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-responsive text-gray-300 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
              Premium quality meets cutting-edge design. Discover products that push boundaries and define excellence.
            </p>
            <div className="flex items-center justify-center space-x-8 text-hmh-gold-400">
              <div className="flex items-center space-x-2 group">
                <Sparkles className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
                <span className="text-sm font-bold uppercase tracking-wider group-hover:text-hmh-gold-300 transition-colors duration-300">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2 group">
                <Zap className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-bold uppercase tracking-wider group-hover:text-hmh-gold-300 transition-colors duration-300">Fast Delivery</span>
              </div>
              <div className="flex items-center space-x-2 group">
                <Shield className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-bold uppercase tracking-wider group-hover:text-hmh-gold-300 transition-colors duration-300">Secure Shopping</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/products">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900 px-12 py-6 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-premium-xl hover:shadow-premium-xl group"
              >
                SHOP NOW
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link to="/products?featured=true">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-hmh-gold-500 text-hmh-gold-500 hover:bg-hmh-gold-500 hover:text-hmh-black-900 bg-transparent px-12 py-6 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-sm group"
              >
                EXPLORE COLLECTION
                <Sparkles className="ml-3 w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
          
          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-black text-hmh-gold-500 mb-2 group-hover:scale-110 transition-transform duration-300">10K+</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-hmh-gold-400 transition-colors duration-300">Happy Customers</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-black text-hmh-gold-500 mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-hmh-gold-400 transition-colors duration-300">Premium Products</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl md:text-5xl font-black text-hmh-gold-500 mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider font-bold group-hover:text-hmh-gold-400 transition-colors duration-300">Countries Worldwide</div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
          <div className="flex flex-col items-center text-hmh-gold-400 group cursor-pointer">
            <span className="text-sm font-bold uppercase tracking-wider mb-2 group-hover:text-hmh-gold-300 transition-colors duration-300">Scroll to explore</span>
            <ChevronRight className="w-6 h-6 rotate-90 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </section>

      {/* Enhanced Featured Categories Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-hmh-gold-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-hmh-gold-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-responsive font-black text-hmh-black-900 mb-6">
              Shop by <span className="text-gradient">Category</span>
            </h2>
            <p className="text-xl text-hmh-black-600 max-w-2xl mx-auto">
              Discover our curated collections designed for the modern lifestyle
            </p>
          </div>
          
          {loadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-gray-200 rounded-2xl mb-4 loading-shimmer"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 loading-shimmer"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 loading-shimmer"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categoryList.slice(0, 8).map((category: Category, index: number) => (
                <Link key={category._id || category.id} to={`/products?category=${category._id || category.id}`}>
                  <Card className="product-card group overflow-hidden opacity-100 visible" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-hmh-gold-400/20 to-hmh-gold-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-hmh-gold-400 to-hmh-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
                            <Sparkles className="w-8 h-8 text-hmh-black-900" />
                          </div>
                          <h3 className="text-lg font-bold text-hmh-black-900 group-hover:text-hmh-gold-600 transition-colors duration-300">{category.name}</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        {category.description && (
                          <p className="text-hmh-black-600 text-sm leading-relaxed">{category.description}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-hmh-gold-600 font-bold text-sm">Explore</span>
                          <ArrowRight className="w-4 h-4 text-hmh-gold-600 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Featured Products Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-hmh-gold-50/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-hmh-gold-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-responsive font-black text-hmh-black-900 mb-6">
              Featured <span className="text-gradient">Products</span>
            </h2>
            <p className="text-xl text-hmh-black-600 max-w-2xl mx-auto">
              Handpicked premium products that define excellence and style
            </p>
          </div>
          
          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-64 bg-gray-200 rounded-t-2xl loading-shimmer"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 loading-shimmer"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 loading-shimmer"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featured.slice(0, 8).map((product: Product, index: number) => (
                <Link key={product._id || product.id} to={`/products/${product._id || product.id}`}>
                  <Card className="product-card group overflow-hidden fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="h-64 bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img 
                              src={`https://hmhglobal.co.uk${product.images[0]}`}
                              alt={product.name}
                              className="product-image w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <Sparkles className="w-12 h-12 text-hmh-gold-500 mx-auto mb-2" />
                              <span className="text-hmh-black-600 text-sm">Product Image</span>
                            </div>
                          )}
                        </div>
                        {product.salePrice && (
                          <Badge className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-premium animate-pulse">
                            SALE
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Quick action buttons */}
                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md">
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg mb-3 text-hmh-black-900 line-clamp-2 group-hover:text-hmh-gold-600 transition-colors duration-300">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {product.salePrice ? (
                              <>
                                <span className="text-xl font-black text-red-600">
                                  {formatPrice(product.salePrice)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-black text-hmh-black-900">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-hmh-gold-500 fill-current" />
                            <span className="text-sm font-bold text-hmh-black-700">
                              {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '0.0'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-hmh-black-600 uppercase tracking-wider font-bold">
                            {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-hmh-gold-600 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12 fade-in-up">
            <Link to="/products">
              <Button className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900 px-8 py-4 text-lg font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-premium hover:shadow-premium-lg group">
                View All Products
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-gradient-to-br from-hmh-gold-50 to-hmh-gold-100 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-hmh-gold-200/20 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-hmh-gold-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-responsive font-black text-hmh-black-900 mb-6">
              Why Choose <span className="text-gradient">HMH Global</span>
            </h2>
            <p className="text-xl text-hmh-black-600 max-w-2xl mx-auto">
              Experience premium service and quality that sets us apart
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group fade-in-up">
              <div className="w-20 h-20 bg-gradient-to-br from-hmh-gold-400 to-hmh-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
                <Truck className="w-10 h-10 text-hmh-black-900" />
              </div>
              <h3 className="text-2xl font-bold text-hmh-black-900 mb-4 group-hover:text-hmh-gold-600 transition-colors duration-300">Free Shipping</h3>
              <p className="text-hmh-black-600 leading-relaxed">Free shipping on orders over $50 with premium packaging and tracking</p>
            </div>
            <div className="text-center group fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-hmh-gold-400 to-hmh-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
                <Shield className="w-10 h-10 text-hmh-black-900" />
              </div>
              <h3 className="text-2xl font-bold text-hmh-black-900 mb-4 group-hover:text-hmh-gold-600 transition-colors duration-300">Secure Payment</h3>
              <p className="text-hmh-black-600 leading-relaxed">100% secure and encrypted payments with multiple payment options</p>
            </div>
            <div className="text-center group fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-hmh-gold-400 to-hmh-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
                <Zap className="w-10 h-10 text-hmh-black-900" />
              </div>
              <h3 className="text-2xl font-bold text-hmh-black-900 mb-4 group-hover:text-hmh-gold-600 transition-colors duration-300">24/7 Support</h3>
              <p className="text-hmh-black-600 leading-relaxed">Round-the-clock customer support with dedicated premium service</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
