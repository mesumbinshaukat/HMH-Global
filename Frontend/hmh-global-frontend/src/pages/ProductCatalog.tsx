import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/products'
import { categoryService } from '../services/categories'
import { cartService } from '../services/cart'
import { Product, Category, ProductFilters } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { SelectWithNullState } from '../components/ui/select-with-null-state'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { ChevronDownIcon, FilterIcon, SearchIcon, Grid3X3, List, Star, Sparkles, ArrowRight, Heart, Eye, ShoppingCart, Zap, Shield, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore, useCartStore } from '../store'
import { toast } from 'sonner'
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
    sortBy: searchParams.get('sortBy') as any || undefined,
    sortOrder: searchParams.get('sortOrder') as any || undefined,
  });

  // Sync filters with searchParams when URL changes
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      brand: searchParams.get('brand') || undefined,
      sortBy: searchParams.get('sortBy') as any || undefined,
      sortOrder: searchParams.get('sortOrder') as any || undefined,
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
    try {
      if (priceRange.min && !isNaN(Number(priceRange.min))) {
        handleFilterChange('minPrice', Number(priceRange.min))
      }
      if (priceRange.max && !isNaN(Number(priceRange.max))) {
        handleFilterChange('maxPrice', Number(priceRange.max))
      }
    } catch (error) {
      console.error('Error applying price filter:', error)
      toast.error('Invalid price range')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchTerm('')
    setPriceRange({ min: '', max: '' })
    setCurrentPage(1)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price)
  }

  // Auth and cart state
  const { isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const queryClient = useQueryClient()

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addToCart(productId, quantity),
    onSuccess: (response) => {
      setCart(response.data || null)
      toast.success('Product added to cart successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add product to cart')
    },
  })

  const handleAddToCart = (productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault() // Prevent navigation when clicking add to cart
      e.stopPropagation()
    }
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      return
    }
    
    addToCartMutation.mutate({ productId, quantity: 1 })
  }

  const handleAddToWishlist = (productId: string) => {
    toast.success('Added to wishlist')
  }

  const handleQuickView = (productId: string) => {
    window.location.href = `/products/${productId}`
  }

  const ProductCard: React.FC<{
    product: Product;
    viewMode: 'grid' | 'list';
    onAddToCart?: (productId: string, e?: React.MouseEvent) => void;
    onAddToWishlist?: (productId: string) => void;
    onQuickView?: (productId: string) => void;
    hoveredProduct?: string | null;
    setHoveredProduct?: React.Dispatch<React.SetStateAction<string | null>>;
  }> = ({ product, viewMode, onAddToCart, onAddToWishlist, onQuickView, hoveredProduct, setHoveredProduct }) => {
    const isHovered = hoveredProduct === product._id || hoveredProduct === product.id

    if (viewMode === 'list') {
      return (
        <Card className="product-card group overflow-hidden fade-in-up">
          <CardContent className="p-0">
            <div className="flex">
              <div className="relative w-48 h-48 flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL}${product.images[0]}`}
                      alt={product.name}
                      className="product-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="text-center w-full h-full flex flex-col items-center justify-center" style={{ display: product.images?.[0] ? 'none' : 'flex' }}>
                    <div className="w-16 h-16 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
                      <Sparkles className="w-8 h-8 text-commando-green-900" />
                    </div>
                    <span className="text-commando-green-600 text-sm font-bold">No Image Available</span>
                  </div>
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
                    <h3 className="font-bold text-xl mb-2 text-commando-green-900 group-hover:text-commando-green-700 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-commando-green-600 text-sm line-clamp-2 mb-4">
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
                        <span className="text-2xl font-black text-commando-green-900">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-4 h-4 text-baby-pink-500 fill-current" />
                      <span className="text-sm font-bold text-commando-green-700">
                        {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-xs text-commando-green-600">({product.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-commando-green-600 uppercase tracking-wider font-bold">
                      {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.brand && (
                      <Badge variant="outline" className="text-xs">
                        {product.brand}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="border-baby-pink-500 text-baby-pink-600 hover:bg-baby-pink-50" onClick={() => onAddToWishlist && onAddToWishlist(product._id || product.id)}>
                      <Heart className="w-4 h-4 mr-1" />
                      Wishlist
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={(e) => onAddToCart && onAddToCart(product._id || product.id, e)}
                      disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                      className="bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {addToCartMutation.isPending ? 'Adding...' : product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
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
        onMouseEnter={() => setHoveredProduct && setHoveredProduct(product._id || product.id)}
        onMouseLeave={() => setHoveredProduct && setHoveredProduct(null)}
      >
        <CardContent className="p-0">
          <div className="relative">
            <div className="h-64 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 flex items-center justify-center overflow-hidden">
              {product.images?.[0] ? (
                <img 
                  src={`${process.env.REACT_APP_API_URL}${product.images[0]}`}
                  alt={product.name}
                  className="product-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="text-center w-full h-full flex flex-col items-center justify-center" style={{ display: product.images?.[0] ? 'none' : 'flex' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-premium">
                  <Sparkles className="w-8 h-8 text-commando-green-900" />
                </div>
                <span className="text-commando-green-600 text-sm font-bold">No Image Available</span>
              </div>
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
              <Button 
                size="sm" 
                onClick={(e) => onAddToCart && onAddToCart(product._id || product.id, e)}
                disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                className="bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-commando-green-900 shadow-premium"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {addToCartMutation.isPending ? 'Adding...' : product.stockQuantity === 0 ? 'Out of Stock' : 'Quick Add'}
              </Button>
            </div>
          </div>
          <div className="p-6">
            <h3 className="font-bold text-lg mb-3 text-commando-green-900 line-clamp-2 group-hover:text-commando-green-700 transition-colors duration-300">
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
                  <span className="text-xl font-black text-commando-green-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-baby-pink-500 fill-current" />
                <span className="text-sm font-bold text-commando-green-700">
                  {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '0.0'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-commando-green-600 uppercase tracking-wider font-bold">
                {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
              <ArrowRight className="w-4 h-4 text-baby-pink-600 group-hover:translate-x-1 transition-transform duration-300" />
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
    <div className="min-h-screen bg-gradient-to-br from-baby-pink-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-commando-green-50 to-baby-pink-100 py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-baby-pink-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-commando-green-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-commando-green-900 mb-6">
              Our <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">Product Collection</span>
            </h1>
            <p className="text-xl text-commando-green-700 max-w-2xl mx-auto">
              Discover our carefully curated selection of premium products designed for your lifestyle
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-baby-pink-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search Bar */}
            <div className="flex-1 w-full lg:w-auto">
              <form onSubmit={handleSearch} className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-commando-green-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 rounded-full text-commando-green-900 placeholder-commando-green-500"
                />
              </form>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-baby-pink-50 rounded-full p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`rounded-full transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-baby-pink-500 text-white shadow-md'
                    : 'text-commando-green-600 hover:text-commando-green-700 hover:bg-baby-pink-100'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`rounded-full transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-baby-pink-500 text-white shadow-md'
                    : 'text-commando-green-600 hover:text-commando-green-700 hover:bg-baby-pink-100'
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300 rounded-full px-6 py-3 transition-all duration-300"
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-baby-pink-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-semibold text-commando-green-700 mb-2 block">Category</Label>
                  <SelectWithNullState
                    value={filters.category || ''}
                    onValueChange={(value) => handleFilterChange('category', value || undefined)}
                    placeholder="All Categories"
                  >
                    {categories.map((category: Category) => (
                      <SelectItem key={category._id || category.id} value={category._id || category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectWithNullState>
                </div>

                {/* Price Range Filter */}
                <div>
                  <Label className="text-sm font-semibold text-commando-green-700 mb-2 block">Price Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900"
                    />
                  </div>
                  <Button
                    onClick={handlePriceFilter}
                    size="sm"
                    className="mt-2 bg-baby-pink-500 hover:bg-baby-pink-600 text-white rounded-full px-4 py-2 text-sm transition-all duration-300"
                  >
                    Apply
                  </Button>
                </div>

                {/* Sort By Filter */}
                <div>
                  <Label className="text-sm font-semibold text-commando-green-700 mb-2 block">Sort By</Label>
                  <Select
                    value={filters.sortBy || ''}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="createdAt">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order Filter */}
                <div>
                  <Label className="text-sm font-semibold text-commando-green-700 mb-2 block">Order</Label>
                  <Select
                    value={filters.sortOrder || ''}
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger className="border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900">
                      <SelectValue placeholder="Order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-commando-green-600 hover:text-commando-green-700 hover:bg-commando-green-50 rounded-full px-6 py-2 transition-all duration-300"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count and Active Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="text-commando-green-700 mb-4 sm:mb-0">
            {productsLoading ? (
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            ) : (
              <p>
                Showing {products.length} of {pagination?.total || 0} products
              </p>
            )}
          </div>

          {/* Active Filters Display */}
          {Object.entries(filters).some(([key, value]) => value !== undefined && value !== '') && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (value === undefined || value === '') return null
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="bg-baby-pink-100 text-commando-green-700 border-baby-pink-200 hover:bg-baby-pink-200 transition-all duration-300"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key as keyof ProductFilters, undefined)}
                      className="ml-2 text-commando-green-500 hover:text-commando-green-700"
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="text-center py-12">
            <div className="text-commando-green-600 mb-4">
              <Shield className="w-16 h-16 mx-auto mb-4 text-commando-green-400" />
              <h3 className="text-xl font-semibold text-commando-green-900 mb-2">Error Loading Products</h3>
              <p className="text-commando-green-600">Please try again later.</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-commando-green-600 mb-4">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-baby-pink-400" />
              <h3 className="text-xl font-semibold text-commando-green-900 mb-2">No Products Found</h3>
              <p className="text-commando-green-600">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {products.map((product: Product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                viewMode={viewMode}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                onQuickView={handleQuickView}
                hoveredProduct={hoveredProduct}
                setHoveredProduct={setHoveredProduct}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300 rounded-full px-4 py-2 transition-all duration-300 disabled:opacity-50"
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded-full px-4 py-2 transition-all duration-300 ${
                      currentPage === pageNum
                        ? 'bg-baby-pink-500 text-white shadow-md'
                        : 'border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300'
                    }`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300 rounded-full px-4 py-2 transition-all duration-300 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCatalog
