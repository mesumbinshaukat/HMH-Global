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
  const tax = subtotal * 0.08 // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + tax + shipping - discount

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Items</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCart}
                  disabled={clearCartMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  {clearCartMutation.isPending ? 'Clearing...' : 'Clear Cart'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                    <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                      <img
                        src={item.product.images[0] || '/api/placeholder/80/80'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product.id}`} className="block">
                        <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.product.brand && (
                          <Badge variant="outline" className="mr-2">{item.product.brand}</Badge>
                        )}
                        {item.product.category?.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {item.product.salePrice ? (
                          <>
                            <span className="text-lg font-bold text-red-600">${item.product.salePrice}</span>
                            <span className="text-sm text-gray-500 line-through">${item.product.price}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">${item.product.price}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                      >
                        <MinusIcon className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity || updateQuantityMutation.isPending}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.product.id)}
                        disabled={removeItemMutation.isPending}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Coupon Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coupon Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={applyCouponMutation.isPending || !!appliedCoupon}
                    className="w-full"
                  >
                    {applyCouponMutation.isPending ? 'Applying...' : 'Apply Coupon'}
                  </Button>
                  {appliedCoupon && (
                    <div className="text-green-600 text-sm">
                      Coupon "{appliedCoupon}" applied! Discount: ${discount.toFixed(2)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-1">
                    <span>Shipping</span>
                    {shipping === 0 && <TruckIcon className="w-4 h-4 text-green-600" />}
                  </div>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                
                {subtotal < 50 && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <TruckIcon className="w-4 h-4 inline mr-1" />
                    Add ${(50 - subtotal).toFixed(2)} more to get free shipping!
                  </div>
                )}
                
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
