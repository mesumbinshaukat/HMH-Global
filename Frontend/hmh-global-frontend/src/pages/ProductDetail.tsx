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
import { StarIcon, HeartIcon, ShareIcon, ArrowLeftIcon, ShoppingCartIcon, TruckIcon, ShieldCheckIcon, RefreshCwIcon } from 'lucide-react'
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

  // Fetch product details
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id!),
    enabled: !!id,
  })

  // Fetch product reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewService.getProductReviews(id!),
    enabled: !!id,
  })

  const product = productData?.data
  const reviews = reviewsData?.data || []

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

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart')
      navigate('/login')
      return
    }

    if (!product || product.stockQuantity === 0) {
      toast.error('Product is out of stock')
      return
    }

    addToCartMutation.mutate({ productId: product.id, quantity })
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please login to add a review')
      navigate('/login')
      return
    }

    addReviewMutation.mutate(reviewForm)
  }

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist')
      navigate('/login')
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
      toast.success('Product link copied to clipboard!')
    }
  }

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton height={40} width={200} className="mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Skeleton height={400} className="mb-4" />
              <div className="flex space-x-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={80} width={80} />
                ))}
              </div>
            </div>
            <div>
              <Skeleton height={32} className="mb-4" />
              <Skeleton height={20} count={3} className="mb-4" />
              <Skeleton height={24} width={100} className="mb-4" />
              <Skeleton height={40} width={200} className="mb-4" />
              <Skeleton height={100} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Products</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-white">
              <img
                src={product.images[selectedImage] || '/api/placeholder/600/600'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image || '/api/placeholder/80/80'}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.averageRating) ? 'fill-current' : 'fill-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.reviewCount} reviews)</span>
                </div>
                {product.brand && (
                  <Badge variant="outline">{product.brand}</Badge>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                {product.salePrice ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">${product.salePrice}</span>
                    <span className="text-xl text-gray-500 line-through">${product.price}</span>
                    <Badge variant="destructive">Sale</Badge>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">${product.price}</span>
                )}
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                product.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stockQuantity > 0 ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    In Stock ({product.stockQuantity} available)
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Out of Stock
                  </>
                )}
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="quantity">Quantity:</Label>
                  <Select value={quantity.toString()} onValueChange={(value) => setQuantity(Number(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: Math.min(10, product.stockQuantity) }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                  className="flex-1 flex items-center space-x-2"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  <span>{addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWishlist}
                  className="flex items-center space-x-2"
                >
                  <HeartIcon className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center space-x-2"
                >
                  <ShareIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <TruckIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Free Shipping</p>
                    <p className="text-xs text-gray-500">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Secure Payment</p>
                    <p className="text-xs text-gray-500">100% secure checkout</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <RefreshCwIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Easy Returns</p>
                    <p className="text-xs text-gray-500">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specifications available for this product.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Customer Reviews</CardTitle>
                    {isAuthenticated && (
                      <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                        {showReviewForm ? 'Cancel' : 'Write a Review'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="mb-6 p-4 border rounded-lg">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rating">Rating</Label>
                          <Select value={reviewForm.rating.toString()} onValueChange={(value) => setReviewForm(prev => ({ ...prev, rating: Number(value) }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Star</SelectItem>
                              <SelectItem value="2">2 Stars</SelectItem>
                              <SelectItem value="3">3 Stars</SelectItem>
                              <SelectItem value="4">4 Stars</SelectItem>
                              <SelectItem value="5">5 Stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="title">Review Title</Label>
                          <Input
                            id="title"
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter a title for your review"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="comment">Your Review</Label>
                          <Textarea
                            id="comment"
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Share your experience with this product"
                            rows={4}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={addReviewMutation.isPending}>
                          {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border-b pb-4">
                          <Skeleton height={20} width={200} className="mb-2" />
                          <Skeleton height={16} count={3} />
                        </div>
                      ))}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review: Review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{review.title}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>{review.user.firstName} {review.user.lastName}</span>
                                <span>•</span>
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'fill-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProductDetail
