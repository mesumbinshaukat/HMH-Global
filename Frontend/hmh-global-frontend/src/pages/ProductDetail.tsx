import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/products'
import { reviewService } from '../services/reviews'
import { cartService } from '../services/cart'
import { useAuthStore, useCartStore } from '../store'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { StarIcon, HeartIcon, ShareIcon, ArrowLeftIcon, ShoppingCartIcon, TruckIcon, ShieldCheckIcon, RefreshCwIcon, Sparkles, Star, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Review } from '../types'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { setCart } = useCartStore()
  const queryClient = useQueryClient()
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: ''
  })
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Fetch product details - moved before early return to comply with hooks rules
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id!),
    enabled: !!id && id !== 'undefined' && id !== 'null',
  })

  // Fetch product reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewService.getProductReviews(id!),
    enabled: !!id && id !== 'undefined' && id !== 'null',
  })

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

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: (reviewData: any) => reviewService.addReview(id!, reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      setShowReviewForm(false)
      setReviewForm({ rating: 5, title: '', comment: '' })
      toast.success('Review added successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add review')
    },
  })

  // Early return for undefined or invalid product ID
  if (!id || id === 'undefined' || id === 'null') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-hmh-black-900" />
          </div>
          <h1 className="text-3xl font-black text-hmh-black-900 mb-4">Product Not Found</h1>
          <p className="text-hmh-black-600 mb-8 max-w-md mx-auto">The product you're looking for doesn't exist or has been removed from our collection.</p>
          <Button 
            variant="premium" 
            size="lg"
            onClick={() => navigate('/products')}
            className="px-8 py-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  // Use correct backend response structure
  const product = productData?.data
  const reviews = reviewsData?.data || []

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      return
    }
    addToCartMutation.mutate({ productId: id!, quantity })
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to submit a review')
      return
    }
    addReviewMutation.mutate(reviewForm)
  }

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist')
      return
    }
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price)
  }

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <Skeleton height={500} className="rounded-2xl" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height={100} className="rounded-xl" />
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-6">
              <Skeleton height={32} className="w-3/4" />
              <Skeleton height={24} className="w-1/2" />
              <Skeleton height={20} count={3} />
              <Skeleton height={48} className="w-1/3" />
              <Skeleton height={56} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-hmh-black-900 mb-4">Product Not Found</h1>
          <p className="text-hmh-black-600 mb-8 max-w-md mx-auto">The product you're looking for doesn't exist or has been removed from our collection.</p>
          <Button 
            variant="premium" 
            size="lg"
            onClick={() => navigate('/products')}
            className="px-8 py-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-hmh-black-600">
            <button 
              onClick={() => navigate('/products')}
              className="hover:text-rose-600 transition-colors duration-200"
            >
              Products
            </button>
            <span>/</span>
            <span className="text-hmh-black-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl overflow-hidden">
                {product.images?.[selectedImage] ? (
                  <img
src={`${process.env.REACT_APP_API_URL}${product.images[selectedImage]}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                      <span className="text-hmh-black-600">Product Image</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sale Badge */}
              {product.salePrice && (
                <Badge variant="sale" className="absolute top-4 left-4">
                  SALE
                </Badge>
              )}
              
              {/* Featured Badge */}
              {product.isFeatured && (
                <Badge variant="featured" className="absolute top-4 right-4">
                  FEATURED
                </Badge>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index 
                        ? 'border-rose-500 shadow-lg' 
                        : 'border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    <img
src={`${process.env.REACT_APP_API_URL}${image}`}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Product Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {product.brand && (
                    <Badge variant="premium" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    product.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleWishlist}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isWishlisted 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    <HeartIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-rose-100 hover:text-rose-600 transition-all duration-200"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h1 className="text-4xl font-black text-hmh-black-900 mb-4 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-rose-500 fill-current" />
                  <span className="text-lg font-bold text-hmh-black-900">
                    {typeof product.averageRating === 'number' ? product.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-hmh-black-600">({product.reviewCount} reviews)</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-6">
                {product.salePrice ? (
                  <>
                    <span className="text-4xl font-black text-red-600">
                      {formatPrice(product.salePrice)}
                    </span>
                    <span className="text-2xl text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-red-600 font-bold">
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-black text-hmh-black-900">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="text-lg font-bold text-hmh-black-900 mb-3">Description</h3>
              <p className="text-hmh-black-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label htmlFor="quantity" className="text-sm font-semibold text-hmh-black-900">
                  Quantity:
                </Label>
                <Select value={quantity.toString()} onValueChange={(value) => setQuantity(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-4 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {addToCartMutation.isPending ? (
                  <RefreshCwIcon className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingCartIcon className="w-5 h-5 mr-2" />
                )}
                {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-hmh-black-900">Free Shipping</p>
                  <p className="text-xs text-hmh-black-600">On orders over £50</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-hmh-black-900">Secure Payment</p>
                  <p className="text-xs text-hmh-black-600">100% protected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                  <RefreshCwIcon className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-hmh-black-900">Easy Returns</p>
                  <p className="text-xs text-hmh-black-600">30-day policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
