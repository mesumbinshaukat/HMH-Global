import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cartService } from '../services/cart'
import { orderService } from '../services/orders'
import { useAuthStore, useCartStore } from '../store'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { CreditCardIcon, TruckIcon, ShieldCheckIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CheckoutRequest } from '../types'
import { checkoutSchema } from '../lib/validations'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Extended validation schema with payment fields
const extendedCheckoutSchema = checkoutSchema.extend({
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  cardholderName: z.string().optional(),
})

type ExtendedCheckoutFormData = z.infer<typeof extendedCheckoutSchema>

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { cart, setCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [sameAsShipping, setSameAsShipping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<ExtendedCheckoutFormData>({
    resolver: zodResolver(extendedCheckoutSchema),
    defaultValues: {
      paymentMethod: 'card',
      sameAsShipping: false,
      shippingAddress: {
        country: 'US',
      },
      billingAddress: {
        country: 'US',
      },
    },
  })

  const paymentMethod = watch('paymentMethod')

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
    enabled: isAuthenticated,
  })

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: (data: CheckoutRequest) => orderService.createOrder(data),
    onSuccess: (response) => {
      setCart(null)
      toast.success('Order placed successfully!')
      navigate(`/orders/${response.data?.id || ''}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place order')
      setIsProcessing(false)
    },
  })

  const currentCart = cartData?.data || cart
  const cartItems = currentCart?.items || []

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.20
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + tax + shipping

  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked)
    setValue('sameAsShipping', checked)
    
    if (checked) {
      const shippingData = getValues('shippingAddress')
      setValue('billingAddress', shippingData)
    }
  }

  const onSubmit = (data: ExtendedCheckoutFormData) => {
    setIsProcessing(true)
    
    const orderData: CheckoutRequest = {
      shippingAddress: data.shippingAddress,
      billingAddress: data.sameAsShipping ? data.shippingAddress : data.billingAddress,
      paymentMethod: data.paymentMethod,
    }

    placeOrderMutation.mutate(orderData)
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ready to Checkout?</h1>
          <p className="text-gray-600 mb-8">Choose how you'd like to complete your purchase</p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/login', { state: { from: '/checkout' } })}
              className="w-full"
            >
              Sign In to Your Account
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 px-2 text-gray-500">Or</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/guest-checkout', { 
                state: { cartItems: cartItems } 
              })}
              className="w-full"
            >
              Continue as Guest
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Guest checkout allows you to place an order without creating an account
          </p>
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
              <Skeleton height={400} />
            </div>
            <div>
              <Skeleton height={300} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout.</p>
          <Button onClick={() => navigate('/products')}>Start Shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Cart</span>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? <CheckCircleIcon className="w-5 h-5" /> : step}
                </div>
                <span className={`ml-2 text-sm ${
                  step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Shipping' : step === 2 ? 'Payment' : 'Review'}
                </span>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Shipping Address */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TruckIcon className="w-5 h-5" />
                      <span>Shipping Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingAddress.firstName">First Name *</Label>
                        <Input
                          id="shippingAddress.firstName"
                          {...register('shippingAddress.firstName')}
                          error={errors.shippingAddress?.firstName?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.lastName">Last Name *</Label>
                        <Input
                          id="shippingAddress.lastName"
                          {...register('shippingAddress.lastName')}
                          error={errors.shippingAddress?.lastName?.message}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingAddress.company">Company (Optional)</Label>
                      <Input
                        id="shippingAddress.company"
                        {...register('shippingAddress.company')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingAddress.street">Street Address *</Label>
                      <Input
                        id="shippingAddress.street"
                        {...register('shippingAddress.street')}
                        error={errors.shippingAddress?.street?.message}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="shippingAddress.city">City *</Label>
                        <Input
                          id="shippingAddress.city"
                          {...register('shippingAddress.city')}
                          error={errors.shippingAddress?.city?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.state">State *</Label>
                        <Input
                          id="shippingAddress.state"
                          {...register('shippingAddress.state')}
                          error={errors.shippingAddress?.state?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.zipCode">ZIP Code *</Label>
                        <Input
                          id="shippingAddress.zipCode"
                          {...register('shippingAddress.zipCode')}
                          error={errors.shippingAddress?.zipCode?.message}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingAddress.country">Country *</Label>
                        <Select value={watch('shippingAddress.country')} onValueChange={(value) => setValue('shippingAddress.country', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="MX">Mexico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.phone">Phone (Optional)</Label>
                        <Input
                          id="shippingAddress.phone"
                          {...register('shippingAddress.phone')}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="button" onClick={nextStep}>
                        Continue to Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCardIcon className="w-5 h-5" />
                        <span>Payment Method</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={paymentMethod} onValueChange={(value: any) => setValue('paymentMethod', value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center space-x-2">
                            <CreditCardIcon className="w-4 h-4" />
                            <span>Credit/Debit Card</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label htmlFor="paypal">PayPal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label htmlFor="bank_transfer">Bank Transfer</Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {paymentMethod === 'card' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Card Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="cardholderName">Cardholder Name</Label>
                          <Input
                            id="cardholderName"
                            {...register('cardholderName')}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            {...register('cardNumber')}
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              {...register('expiryDate')}
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              {...register('cvv')}
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sameAsShipping"
                          checked={sameAsShipping}
                          onCheckedChange={handleSameAsShippingChange}
                        />
                        <Label htmlFor="sameAsShipping">Same as shipping address</Label>
                      </div>
                      
                      {!sameAsShipping && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="billingAddress.firstName">First Name *</Label>
                              <Input
                                id="billingAddress.firstName"
                                {...register('billingAddress.firstName')}
                                error={errors.billingAddress?.firstName?.message}
                              />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress.lastName">Last Name *</Label>
                              <Input
                                id="billingAddress.lastName"
                                {...register('billingAddress.lastName')}
                                error={errors.billingAddress?.lastName?.message}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="billingAddress.street">Street Address *</Label>
                            <Input
                              id="billingAddress.street"
                              {...register('billingAddress.street')}
                              error={errors.billingAddress?.street?.message}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="billingAddress.city">City *</Label>
                              <Input
                                id="billingAddress.city"
                                {...register('billingAddress.city')}
                                error={errors.billingAddress?.city?.message}
                              />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress.state">State *</Label>
                              <Input
                                id="billingAddress.state"
                                {...register('billingAddress.state')}
                                error={errors.billingAddress?.state?.message}
                              />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress.zipCode">ZIP Code *</Label>
                              <Input
                                id="billingAddress.zipCode"
                                {...register('billingAddress.zipCode')}
                                error={errors.billingAddress?.zipCode?.message}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back to Shipping
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Review Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review Order */}
              {currentStep === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Review Your Order</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Order Items</h3>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 py-2 border-b">
                          <img
                            src={item.product.images[0] || '/api/placeholder/60/60'}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                        <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                        <div className="text-sm text-gray-600">
                          <p>{getValues('shippingAddress.firstName')} {getValues('shippingAddress.lastName')}</p>
                          <p>{getValues('shippingAddress.street')}</p>
                          <p>{getValues('shippingAddress.city')}, {getValues('shippingAddress.state')} {getValues('shippingAddress.zipCode')}</p>
                          <p>{getValues('shippingAddress.country')}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Payment Method</h3>
                        <div className="text-sm text-gray-600">
                          <p className="capitalize">{paymentMethod.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back to Payment
                      </Button>
                      <Button type="submit" disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Place Order'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (20%)</span>
                      <span>£{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>£{total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheckIcon className="w-4 h-4" />
                      <span>Secure SSL encryption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="w-4 h-4" />
                      <span>Free shipping on orders over £50</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CheckoutPage
