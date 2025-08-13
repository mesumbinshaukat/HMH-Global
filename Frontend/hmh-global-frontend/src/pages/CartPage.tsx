import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../services/cart'
import { useAuthStore, useCartStore } from '../store'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { ShoppingBagIcon, TrashIcon, PlusIcon, MinusIcon, ArrowLeftIcon, TruckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CartItem } from '../types'
import { Link } from 'react-router-dom'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Label } from '../components/ui/label'

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { cart, setCart } = useCartStore()
  const queryClient = useQueryClient()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading, error: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
  })

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.updateCartItem(productId, quantity),
    onSuccess: (response) => {
      setCart(response.data || null)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cart')
    },
  })

  // Remove cart item
  const removeItemMutation = useMutation({
    mutationFn: (productId: string) => cartService.removeFromCart(productId),
    onSuccess: (response) => {
      setCart(response.data || null)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Item removed from cart')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove item')
    },
  })

  // Clear cart
  const clearCartMutation = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      setCart(null)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Cart cleared')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear cart')
    },
  })

  // Apply coupon
  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => cartService.applyCoupon(code),
    onSuccess: (response) => {
      setAppliedCoupon(couponCode)
      setDiscount(response.data?.discount || 0)
      toast.success('Coupon applied successfully!')
      setCouponCode('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid coupon code')
    },
  })

  const currentCart = cartData?.data || cart
  const cartItems = currentCart?.items || []

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return
    updateQuantityMutation.mutate({ productId, quantity })
  }

  const handleRemoveItem = (productId: string) => {
    removeItemMutation.mutate(productId)
  }

  const handleClearCart = () => {
    clearCartMutation.mutate()
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    applyCouponMutation.mutate(couponCode)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.20 // 20% VAT
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + tax + shipping - discount

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      navigate('/checkout')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view your cart.</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </div>
    )
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton height={40} width={200} className="mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton height={24} width={150} />
                </CardHeader>
                <CardContent>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-4 border-b">
                      <Skeleton height={80} width={80} />
                      <div className="flex-1">
                        <Skeleton height={20} width={200} className="mb-2" />
                        <Skeleton height={16} width={100} />
                      </div>
                      <Skeleton height={32} width={80} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton height={24} width={120} />
                </CardHeader>
                <CardContent>
                  <Skeleton height={100} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Cart</h1>
          <p className="text-gray-600 mb-6">There was an error loading your cart. Please try again.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['cart'] })}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-2 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBagIcon className="h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Add some products to your cart to get started.</p>
            <Button onClick={() => navigate('/products')}>Start Shopping</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-baby-pink-50 to-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-commando-green-900 mb-4">
            Your <span className="bg-gradient-to-r from-baby-pink-400 to-baby-pink-600 bg-clip-text text-transparent">Shopping Cart</span>
          </h1>
          <p className="text-xl text-commando-green-700 max-w-2xl mx-auto">
            Review your items and proceed to checkout
          </p>
        </div>

        {cartLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : cartError ? (
          <div className="text-center py-12">
            <div className="text-commando-green-600 mb-4">
              <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 text-commando-green-400" />
              <h3 className="text-xl font-semibold text-commando-green-900 mb-2">Error Loading Cart</h3>
              <p className="text-commando-green-600">Please try again later.</p>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-commando-green-600 mb-4">
              <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 text-baby-pink-400" />
              <h3 className="text-xl font-semibold text-commando-green-900 mb-2">Your Cart is Empty</h3>
              <p className="text-commando-green-600 mb-6">Start shopping to add items to your cart.</p>
              <Link to="/products">
                <Button className="bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white rounded-full px-8 py-3 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item: CartItem) => (
                <Card key={item.product._id || item.product.id} className="card-premium group">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 flex items-center justify-center">
                        {item.product.images?.[0] ? (
                          <img
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${item.product.images[0]}`}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-baby-pink-600 text-center">
                            <ShoppingBagIcon className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-commando-green-900 mb-2 group-hover:text-commando-green-700 transition-colors duration-300 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-commando-green-600 text-sm mb-3 line-clamp-2">
                          {item.product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-baby-pink-600">
                            £{(item.product.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.product._id || item.product.id, item.quantity - 1)}
                              className="w-8 h-8 p-0 border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300 rounded-full transition-all duration-300"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold text-commando-green-900">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.product._id || item.product.id, item.quantity + 1)}
                              className="w-8 h-8 p-0 border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300 rounded-full transition-all duration-300"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.product._id || item.product.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 p-0 transition-all duration-300"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Cart Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className="border-commando-green-200 text-commando-green-700 hover:bg-commando-green-50 hover:border-commando-green-300 rounded-full px-6 py-3 transition-all duration-300"
                >
                  Clear Cart
                </Button>
                <Link to="/products" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-baby-pink-300 text-baby-pink-600 hover:bg-baby-pink-50 hover:border-baby-pink-400 rounded-full px-6 py-3 transition-all duration-300"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="card-premium sticky top-24">
                <CardHeader>
                  <CardTitle className="text-commando-green-900">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-commando-green-700">Coupon Code</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500"
                      />
                      <Button
                        onClick={() => applyCouponMutation.mutate(couponCode)}
                        disabled={!couponCode.trim() || applyCouponMutation.isPending}
                        className="bg-baby-pink-500 hover:bg-baby-pink-600 text-white rounded-full px-4 py-2 transition-all duration-300 disabled:opacity-50"
                      >
                        Apply
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Coupon Applied: {appliedCoupon}
                      </Badge>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 pt-4 border-t border-baby-pink-200">
                    <div className="flex justify-between text-commando-green-700">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-£{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-commando-green-700">
                      <span>Shipping</span>
                      <span className="text-baby-pink-600 font-semibold">Free</span>
                    </div>
                    <div className="pt-3 border-t border-baby-pink-200">
                      <div className="flex justify-between text-xl font-bold text-commando-green-900">
                        <span>Total</span>
                        <span>£{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={!isAuthenticated}
                    className="w-full bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white rounded-full py-4 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
                  >
                    {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-sm text-commando-green-600 text-center">
                      Please <Link to="/login" className="text-baby-pink-600 hover:text-baby-pink-700 underline">login</Link> to complete your purchase
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage
