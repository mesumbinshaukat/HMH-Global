import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService } from '../services/products'
import { categoryService } from '../services/categories'
import { Product, Category, ProductFilters } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { ChevronDownIcon, FilterIcon, SearchIcon, Grid3X3, List, Star, Sparkles, ArrowRight, Heart, Eye, ShoppingCart, Zap, Shield, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const ProductCatalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    brand: searchParams.get('brand') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'newest',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
  });

  // Sync filters with searchParams when URL changes
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      brand: searchParams.get('brand') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    });
    // Optionally reset page to 1 if category/search changes
    setCurrentPage(1);
  }, [searchParams]);
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)

  // Fetch products
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', filters, currentPage],
    queryFn: () => productService.getProducts(filters, currentPage, 12),
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  })

  // Use correct backend response structure
  const products: Product[] = productsData?.data?.data || []
  const pagination = productsData?.data?.pagination
  const categories = categoriesData?.data || []

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString())
      }
    })
    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('search', searchTerm)
  }

  const handlePriceFilter = () => {
    if (priceRange.min) handleFilterChange('minPrice', Number(priceRange.min))
    if (priceRange.max) handleFilterChange('maxPrice', Number(priceRange.max))
  }

  const clearFilters = () => {
    setFilters({
      sortBy: 'newest',
      sortOrder: 'desc'
    })
    setSearchTerm('')
    setPriceRange({ min: '', max: '' })
    setCurrentPage(1)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const ProductCard: React.FC<{ product: Product; viewMode: 'grid' | 'list' }> = ({ product, viewMode }) => {
    const isHovered = hoveredProduct === product._id || hoveredProduct === product.id

    if (viewMode === 'list') {
      return (
        <Card className="product-card group overflow-hidden fade-in-up">
          <CardContent className="p-0">
            <div className="flex">
              <div className="relative w-48 h-48 flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img 
                      src={`http://localhost:5000${product.images[0]}`} 
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
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2 text-hmh-black-900 group-hover:text-hmh-gold-600 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-hmh-black-600 text-sm line-clamp-2 mb-4">
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-2xl font-black text-red-600">
                            {formatPrice(product.salePrice)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-hmh-black-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-4 h-4 text-hmh-gold-500 fill-current" />
                      <span className="text-sm font-bold text-hmh-black-700">
                        {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-xs text-hmh-black-600">({product.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-hmh-black-600 uppercase tracking-wider font-bold">
                      {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.brand && (
                      <Badge variant="outline" className="text-xs">
                        {product.brand}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="border-hmh-gold-500 text-hmh-gold-600 hover:bg-hmh-gold-50">
                      <Heart className="w-4 h-4 mr-1" />
                      Wishlist
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card 
        className="product-card group overflow-hidden fade-in-up"
        onMouseEnter={() => setHoveredProduct(product._id || product.id)}
        onMouseLeave={() => setHoveredProduct(null)}
      >
        <CardContent className="p-0">
          <div className="relative">
            <div className="h-64 bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 flex items-center justify-center overflow-hidden">
              {product.images?.[0] ? (
                <img 
                  src={`http://localhost:5000${product.images[0]}`} 
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
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white rounded-full shadow-md">
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick add to cart button */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
              <Button size="sm" className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900 shadow-premium">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Quick Add
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
    )
  }

  const ProductSkeleton: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
    if (viewMode === 'list') {
      return (
        <Card className="animate-pulse">
          <CardContent className="p-0">
            <div className="flex">
              <div className="w-48 h-48 bg-gray-200 loading-shimmer"></div>
              <div className="flex-1 p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 loading-shimmer"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 loading-shimmer"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 loading-shimmer"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="animate-pulse">
        <CardContent className="p-0">
          <div className="h-64 bg-gray-200 rounded-t-2xl loading-shimmer"></div>
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 loading-shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 loading-shimmer"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-24">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-hmh-gold-500/10 to-hmh-gold-600/10 py-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-hmh-gold-200/20 to-transparent"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hmh-gold-300/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center fade-in-up">
            <h1 className="text-4xl md:text-5xl font-black text-hmh-black-900 mb-4">
              Premium <span className="text-gradient">Products</span>
            </h1>
            <p className="text-xl text-hmh-black-600 max-w-2xl mx-auto">
              Discover our curated collection of premium lifestyle products
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search and Filters */}
        <div className="mb-8 fade-in-up">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Enhanced Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl w-full">
              <div className="search-bar relative">
                <Input
                  type="text"
                  placeholder="Search for premium products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 bg-transparent border-0 text-hmh-black-900 placeholder-gray-500 focus:ring-0 focus:border-0 rounded-full h-12"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-hmh-gold-500 hover:bg-hmh-gold-600 text-hmh-black-900 rounded-full h-8 w-8 p-0 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <SearchIcon className="w-4 h-4" />
                </Button>
              </div>
            </form>

            {/* Enhanced View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white rounded-full shadow-premium p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-full transition-all duration-300 ${viewMode === 'grid' ? 'bg-hmh-gold-500 text-hmh-black-900 shadow-md' : 'hover:bg-hmh-gold-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-full transition-all duration-300 ${viewMode === 'list' ? 'bg-hmh-gold-500 text-hmh-black-900 shadow-md' : 'hover:bg-hmh-gold-50'}`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Enhanced Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-hmh-gold-500 text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-full transition-all duration-300"
              >
                <FilterIcon className="w-4 h-4 mr-2" />
                Filters
                <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-white rounded-2xl shadow-premium border border-gray-100 fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-bold text-hmh-black-900 mb-2 block">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-hmh-gold-500 focus:ring-hmh-gold-500">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category: Category) => (
                        <SelectItem key={category._id || category.id} value={category._id || category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By Filter */}
                <div>
                  <Label className="text-sm font-bold text-hmh-black-900 mb-2 block">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-hmh-gold-500 focus:ring-hmh-gold-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <Label className="text-sm font-bold text-hmh-black-900 mb-2 block">Price Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="border-gray-200 focus:border-hmh-gold-500 focus:ring-hmh-gold-500"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="border-gray-200 focus:border-hmh-gold-500 focus:ring-hmh-gold-500"
                    />
                  </div>
                </div>

                {/* Apply/Clear Buttons */}
                <div className="flex items-end space-x-2">
                  <Button onClick={handlePriceFilter} className="bg-hmh-gold-500 hover:bg-hmh-gold-600 text-hmh-black-900 rounded-full">
                    Apply
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-full">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Products Grid */}
        <div className="mb-8">
          {productsLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8' : 'space-y-6'}>
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : productsError ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">Error loading products</div>
              <Button onClick={() => window.location.reload()} className="bg-hmh-gold-500 hover:bg-hmh-gold-600 text-hmh-black-900">
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-hmh-gold-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-hmh-black-900 mb-2">No products found</h3>
              <p className="text-hmh-black-600 mb-4">Try adjusting your filters or search terms</p>
              <Button onClick={clearFilters} className="bg-hmh-gold-500 hover:bg-hmh-gold-600 text-hmh-black-900">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8' : 'space-y-6'}>
              {products.map((product: Product, index: number) => (
                <Link key={product._id || product.id} to={`/products/${product._id || product.id}`}>
                  <ProductCard product={product} viewMode={viewMode} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2 fade-in-up">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 rounded-full"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-full transition-all duration-300 ${
                    currentPage === page 
                      ? 'bg-hmh-gold-500 text-hmh-black-900 shadow-premium' 
                      : 'border-gray-300 text-gray-600 hover:bg-hmh-gold-50'
                  }`}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 rounded-full"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCatalog
