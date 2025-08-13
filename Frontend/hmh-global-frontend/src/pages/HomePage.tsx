import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useFeaturedProducts, useCategories } from '../hooks/useQuery'
import { formatPrice } from '../lib/utils'
import { Badge } from '../components/ui/badge'
import { Category, Product } from '../types'
import { ChevronRight, ArrowRight, Star, Zap, Shield, Truck, Sparkles, Heart } from 'lucide-react'
// Hero images: load from public folder to avoid CRA restrictions
// Place files in: public/carousels/
// If files are absent, images will simply not render but app will build fine
import { API_BASE_URL } from '../lib/api'

const HomePage: React.FC = () => {
  const { data: featuredProducts, isLoading: loadingProducts } = useFeaturedProducts()
  const { data: categories, isLoading: loadingCategories } = useCategories()

  // Use correct backend response structure
  const featured = featuredProducts?.data || []
  const categoryList = categories?.data || []

  // Simple hero slider
  // Images served from public/carousels (no import outside src)
  const images = [
    '/carousels/1.png',
    '/carousels/2.png',
    '/carousels/3.png',
    '/carousels/4.png',
  ]
  const [currentSlide, setCurrentSlide] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setCurrentSlide((s) => (s + 1) % images.length), 4000)
    return () => clearInterval(id)
  }, [])

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
      {/* Simple Hero Section with Carousel (soft baby pink) */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-baby-pink-50">
        <div className="absolute inset-0">
          {images.map((src, idx) => (
            <img
              key={idx}
              src={src}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              alt="Hero"
            />
          ))}
          <div className="absolute inset-0 bg-baby-pink-100/40" />
        </div>
        <div className="relative z-10 text-center text-commando-green-900 px-4">
          <h1 className="text-3xl md:text-5xl font-semibold mb-4">Discover Everyday Beauty</h1>
          <p className="max-w-2xl mx-auto mb-6 text-commando-green-800">Thoughtfully curated cosmetics and care products at fair prices.</p>
          <Link to="/products">
            <Button size="lg" className="bg-baby-pink-500 hover:bg-baby-pink-600 text-white rounded-full shadow-md px-8">
              Shop Now <ArrowRight className="ml-2 h-5 w-5"/>
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Categories (soft cards, pink accents) */}
      <section className="py-24 bg-gradient-to-br from-baby-pink-50 to-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-baby-pink-100/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-baby-pink-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-responsive font-black text-commando-green-900 mb-6">
              Shop by <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">Category</span>
            </h2>
            <p className="text-xl text-commando-green-700 max-w-2xl mx-auto">
              Discover our curated collections designed for the modern lifestyle
            </p>
          </div>
          
          {loadingCategories ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categoryList.slice(0, 4).map((category: Category) => (
                <Link key={category._id || category.id} to={`/products?category=${category._id || category.id}`}>
                  <Card className="card-premium group h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                        <Sparkles className="w-10 h-10 text-baby-pink-600 group-hover:text-baby-pink-700 transition-colors duration-300" />
                      </div>
                      <h3 className="text-lg font-bold text-commando-green-900 mb-2 group-hover:text-commando-green-700 transition-colors duration-300">
                        {category.name}
                      </h3>
                      <p className="text-sm text-commando-green-600 group-hover:text-commando-green-500 transition-colors duration-300">
                        Explore our {category.name.toLowerCase()} collection
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg" className="border-baby-pink-300 text-baby-pink-600 hover:bg-baby-pink-50 rounded-full px-8">
                View All Categories <ChevronRight className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 bg-gradient-to-br from-white to-baby-pink-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-commando-green-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-commando-green-200/15 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-responsive font-black text-commando-green-900 mb-6">
              Featured <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">Products</span>
            </h2>
            <p className="text-xl text-commando-green-700 max-w-2xl mx-auto">
              Handpicked items that combine quality, style, and affordability
            </p>
          </div>
          
          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.slice(0, 3).map((product: Product) => (
                <Link key={product._id || product.id} to={`/products/${product._id || product.id}`}>
                  <Card className="product-card group h-full">
                    <CardContent className="p-6">
                      <div className="relative mb-4 overflow-hidden rounded-xl">
                        {(() => {
                          const first = product.images?.[0] as unknown as string | undefined;
                          const src = first
                            ? (first.startsWith('http')
                                ? first
                                : `${API_BASE_URL}${first.startsWith('/') ? '' : '/'}${first}`)
                            : '';
                          return (
                            <img
                              src={src}
                              alt={product.name}
                              className="product-image w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          );
                        })()}
                        {typeof product.salePrice === 'number' && product.salePrice < product.price && (
                          <Badge className="absolute top-2 right-2 bg-baby-pink-500 text-white border-0">
                            -{Math.round((1 - product.salePrice / product.price) * 100)}%
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-commando-green-900 mb-2 group-hover:text-commando-green-700 transition-colors duration-300 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (product.averageRating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-commando-green-600 ml-1">
                            ({product.reviewCount || 0})
                          </span>
                        </div>
                        <div className="text-lg font-bold text-baby-pink-600">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                      <p className="text-sm text-commando-green-600 line-clamp-2 mb-4">
                        {product.description}
                      </p>
                      <Button className="w-full bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white rounded-full transition-all duration-300 transform group-hover:scale-105">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg" className="border-commando-green-300 text-commando-green-600 hover:bg-commando-green-50 rounded-full px-8">
                Browse All Products <ChevronRight className="ml-2 h-5 w-5"/>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-commando-green-50 to-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-baby-pink-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-baby-pink-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 fade-in-up">
            <h2 className="text-responsive font-black text-commando-green-900 mb-6">
              Why Choose <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">HMH Global</span>
            </h2>
            <p className="text-xl text-commando-green-700 max-w-2xl mx-auto">
              We're committed to providing you with the best shopping experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Shield className="w-10 h-10 text-baby-pink-600 group-hover:text-baby-pink-700 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-commando-green-900 mb-4 group-hover:text-commando-green-700 transition-colors duration-300">
                Quality Guaranteed
              </h3>
              <p className="text-commando-green-600 group-hover:text-commando-green-500 transition-colors duration-300">
                Every product is carefully selected and tested to ensure the highest quality standards.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Truck className="w-10 h-10 text-baby-pink-600 group-hover:text-baby-pink-700 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-commando-green-900 mb-4 group-hover:text-commando-green-700 transition-colors duration-300">
                Fast Shipping
              </h3>
              <p className="text-commando-green-600 group-hover:text-commando-green-500 transition-colors duration-300">
                Get your products delivered quickly and securely with our reliable shipping partners.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <Heart className="w-10 h-10 text-baby-pink-600 group-hover:text-baby-pink-700 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-commando-green-900 mb-4 group-hover:text-commando-green-700 transition-colors duration-300">
                Customer First
              </h3>
              <p className="text-commando-green-600 group-hover:text-commando-green-500 transition-colors duration-300">
                Our dedicated support team is here to help you with any questions or concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-white/15 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="fade-in-up">
            <h2 className="text-3xl md:text-4xl font-black text-commando-green-900 mb-6">
              Stay in the Loop
            </h2>
            <p className="text-xl text-commando-green-700 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive offers, new product alerts, and beauty tips delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 bg-white border border-baby-pink-300 rounded-full text-commando-green-900 placeholder-commando-green-500 focus:outline-none focus:border-baby-pink-500 focus:ring-2 focus:ring-baby-pink-200 transition-all duration-300"
              />
              <Button className="bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white rounded-full px-8 py-4 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-commando-green-600 mt-4">
              No spam, unsubscribe at any time. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
