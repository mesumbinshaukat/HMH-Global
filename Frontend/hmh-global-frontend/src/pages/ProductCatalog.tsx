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
import { ChevronDownIcon, FilterIcon, SearchIcon } from 'lucide-react'
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
    // Clear URL parameters
    setSearchParams({})
  }

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const productId = product._id || product.id;
  if (!productId) {
    console.warn('ProductCard: Missing product ID for product:', product);
    return (
      <Card className="group hover:shadow-lg transition-shadow duration-200 opacity-50">
        <CardHeader className="p-0">
          <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No Product ID</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <CardTitle className="text-lg font-semibold line-clamp-2 text-gray-400">
            {product.name || 'Unknown Product'}
          </CardTitle>
          <CardDescription className="text-sm text-gray-400 mb-2">
            Product data is incomplete.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <Link to={`/products/${encodeURIComponent(productId)}`}>
          <div className="aspect-square overflow-hidden rounded-t-lg">
            <img
              src={product.images[0] ? `http://localhost:5000${product.images[0]}` : '/api/placeholder/300/300'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            <Link to={`/products/${encodeURIComponent(productId)}`} className="hover:text-blue-600">
              {product.name}
            </Link>
          </CardTitle>
          {product.isFeatured && (
            <Badge variant="secondary" className="ml-2">Featured</Badge>
          )}
        </div>
        <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-2">
          {product.description}
        </CardDescription>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {product.salePrice ? (
              <>
                <span className="text-lg font-bold text-red-600">${product.salePrice}</span>
                <span className="text-sm text-gray-500 line-through">${product.price}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">${product.price}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(product.averageRating) ? 'fill-current' : 'fill-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount})</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {product.brand && (
              <Badge variant="outline" className="text-xs">{product.brand}</Badge>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              product.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <Button size="sm" disabled={product.stockQuantity === 0}>
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

  const ProductSkeleton = () => (
    <Card>
      <CardHeader className="p-0">
        <Skeleton height={300} className="rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton height={20} className="mb-2" />
        <Skeleton height={16} count={2} className="mb-2" />
        <div className="flex justify-between items-center mb-2">
          <Skeleton height={24} width={80} />
          <Skeleton height={16} width={60} />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton height={20} width={60} />
          <Skeleton height={32} width={80} />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Discover our amazing collection of products</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <FilterIcon className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {pagination ? `${pagination.total} products found` : 'Loading...'}
              </span>
              <Select value={filters.sortBy} onValueChange={(value: string) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="name">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Category</Label>
                  <Select value={filters.category?.toString() || 'all'} onValueChange={(value: string) => handleFilterChange('category', value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: Category) => {
                        const categoryId = category._id?.toString() || category.id?.toString();
                        return categoryId ? (
                          <SelectItem key={categoryId} value={categoryId}>
                            {category.name}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Price Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                  <Button size="sm" onClick={handlePriceFilter} className="mt-2 w-full">
                    Apply
                  </Button>
                </div>

                {/* Brand Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Brand</Label>
                  <Input
                    placeholder="Enter brand name"
                    value={filters.brand || ''}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {productsLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))
          ) : productsError ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-600 text-lg">Error loading products. Please try again.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product._id || product.id} product={product as Product} />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              disabled={!pagination.hasPrev}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <div className="flex space-x-1">
              {/* Smart pagination: show first, last, current, two before/after, ellipses */}
{(() => {
  const pages = [];
  const total = pagination.pages;
  const maxButtons = 7; // first, last, current, 2 before, 2 after, and ellipses
  
  if (total <= maxButtons) {
    for (let i = 1; i <= total; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? 'default' : 'outline'}
          onClick={() => setCurrentPage(i)}
          className="w-10 h-10"
        >
          {i}
        </Button>
      );
    }
  } else {
    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? 'default' : 'outline'}
        onClick={() => setCurrentPage(1)}
        className="w-10 h-10"
      >
        1
      </Button>
    );
    // Show ellipsis if needed
    if (currentPage > 4) {
      pages.push(<span key="start-ellipsis" className="px-2">...</span>);
    }
    // Show pages around current
    for (let i = Math.max(2, currentPage - 2); i <= Math.min(total - 1, currentPage + 2); i++) {
      if (i === 1 || i === total) continue;
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? 'default' : 'outline'}
          onClick={() => setCurrentPage(i)}
          className="w-10 h-10"
        >
          {i}
        </Button>
      );
    }
    // Show ellipsis if needed
    if (currentPage < total - 3) {
      pages.push(<span key="end-ellipsis" className="px-2">...</span>);
    }
    // Always show last page
    pages.push(
      <Button
        key={total}
        variant={currentPage === total ? 'default' : 'outline'}
        onClick={() => setCurrentPage(total)}
        className="w-10 h-10"
      >
        {total}
      </Button>
    );
  }
  return pages;
})()}
            </div>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
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
