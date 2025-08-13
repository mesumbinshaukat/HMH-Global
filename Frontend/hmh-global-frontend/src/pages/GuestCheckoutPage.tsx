import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../store'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { CreditCardIcon, TruckIcon, ShieldCheckIcon, ArrowLeftIcon, CheckCircleIcon, UserIcon } from 'lucide-react'
import { toast } from 'sonner'

// Form data interface
interface GuestFormData {
  // Guest Info
  guestName: string
  guestEmail: string
  guestPhone: string
  
  // Payment
  paymentMethod: string
  
  // Shipping Address
  shippingFirstName: string
  shippingLastName: string
  shippingCompany: string
  shippingAddress1: string
  shippingAddress2: string
  shippingCity: string
  shippingState: string
  shippingZipCode: string
  shippingCountry: string
  shippingPhone: string
  
  // Billing Address
  billingFirstName: string
  billingLastName: string
  billingCompany: string
  billingAddress1: string
  billingAddress2: string
  billingCity: string
  billingState: string
  billingZipCode: string
  billingCountry: string
  billingPhone: string
  
  sameAsShipping: boolean
}

const GuestCheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, clearCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [sameAsShipping, setSameAsShipping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state
  const [formData, setFormData] = useState<GuestFormData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    paymentMethod: 'cash-on-delivery',
    shippingFirstName: '',
    shippingLastName: '',
    shippingCompany: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: 'GB',
    shippingPhone: '',
    billingFirstName: '',
    billingLastName: '',
    billingCompany: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'GB',
    billingPhone: '',
    sameAsShipping: false
  })

  // Get cart items from location state or cart store
  const cartItems = location.state?.cartItems || cart?.items || []

  // Place guest order mutation
  const placeGuestOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/orders/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Failed to place order')
      }
      return result
    },
    onSuccess: (response) => {
      clearCart()
      toast.success('Order placed successfully!')
      navigate('/order-success', { 
        state: { 
          orderNumber: response.data.orderNumber,
          email: formData.guestEmail
        }
      })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order')
      setIsProcessing(false)
    },
  })

  // Calculate totals
  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.20 // 20% VAT
  const shipping = formData.paymentMethod === 'cash-on-delivery' ? 
    (subtotal > 50 ? 2.99 : 7.99) : // COD fee
    (subtotal > 50 ? 0 : 5.99)      // Regular shipping
  const total = subtotal + tax + shipping

  // Handle form input changes
  const handleInputChange = (field: keyof GuestFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle same as shipping checkbox
  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked)
    setFormData(prev => ({
      ...prev,
      sameAsShipping: checked,
      ...(checked ? {
        billingFirstName: prev.shippingFirstName,
        billingLastName: prev.shippingLastName,
        billingCompany: prev.shippingCompany,
        billingAddress1: prev.shippingAddress1,
        billingAddress2: prev.shippingAddress2,
        billingCity: prev.shippingCity,
        billingState: prev.shippingState,
        billingZipCode: prev.shippingZipCode,
        billingCountry: prev.shippingCountry,
        billingPhone: prev.shippingPhone
      } : {})
    }))
  }

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Basic validation
    if (!formData.guestName || !formData.guestEmail) {
      toast.error('Please fill in required fields')
      return
    }

    if (!formData.shippingFirstName || !formData.shippingLastName || 
        !formData.shippingAddress1 || !formData.shippingCity || 
        !formData.shippingState || !formData.shippingZipCode) {
      toast.error('Please fill in shipping address')
      return
    }

    if (!sameAsShipping && (!formData.billingFirstName || !formData.billingLastName || 
        !formData.billingAddress1 || !formData.billingCity || 
        !formData.billingState || !formData.billingZipCode)) {
      toast.error('Please fill in billing address')
      return
    }

    setIsProcessing(true)
    
    const orderData = {
      guestInfo: {
        name: formData.guestName,
        email: formData.guestEmail,
        phone: formData.guestPhone
      },
      paymentMethod: formData.paymentMethod,
      shippingAddress: {
        firstName: formData.shippingFirstName,
        lastName: formData.shippingLastName,
        company: formData.shippingCompany,
        address1: formData.shippingAddress1,
        address2: formData.shippingAddress2,
        city: formData.shippingCity,
        state: formData.shippingState,
        zipCode: formData.shippingZipCode,
        country: formData.shippingCountry,
        phone: formData.shippingPhone
      },
      billingAddress: sameAsShipping ? {
        firstName: formData.shippingFirstName,
        lastName: formData.shippingLastName,
        company: formData.shippingCompany,
        address1: formData.shippingAddress1,
        address2: formData.shippingAddress2,
        city: formData.shippingCity,
        state: formData.shippingState,
        zipCode: formData.shippingZipCode,
        country: formData.shippingCountry,
        phone: formData.shippingPhone
      } : {
        firstName: formData.billingFirstName,
        lastName: formData.billingLastName,
        company: formData.billingCompany,
        address1: formData.billingAddress1,
        address2: formData.billingAddress2,
        city: formData.billingCity,
        state: formData.billingState,
        zipCode: formData.billingZipCode,
        country: formData.billingCountry,
        phone: formData.billingPhone
      },
      items: cartItems.map((item: any) => ({
        productId: item.product?._id || item.productId,
        quantity: item.quantity
      }))
    }

    placeGuestOrderMutation.mutate(orderData)
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (cartItems.length === 0) {
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Already have an account? 
            <Button variant="link" className="p-0 ml-1 h-auto" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Checkout</h1>
          <p className="text-gray-600">Complete your order without creating an account</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? <CheckCircleIcon className="w-5 h-5" /> : step}
                </div>
                <span className={`ml-2 text-sm ${
                  step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Guest Info' : step === 2 ? 'Shipping' : step === 3 ? 'Payment' : 'Review'}
                </span>
                {step < 4 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Guest Information */}
              {currentStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5" />
                      <span>Your Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="guestInfo.name">Full Name *</Label>
                      <Input
                        id="guestName"
                        value={formData.guestName}
                        onChange={(e) => handleInputChange('guestName', e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestInfo.email">Email Address *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestInfo.phone">Phone Number (Optional)</Label>
                      <Input
                        id="guestPhone"
                        value={formData.guestPhone}
                        onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                        placeholder="+44 123 456 7890"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="button" onClick={nextStep}>
                        Continue to Shipping
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
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
                          id="shippingFirstName"
                          value={formData.shippingFirstName}
                          onChange={(e) => handleInputChange('shippingFirstName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.lastName">Last Name *</Label>
                        <Input
                          id="shippingLastName"
                          value={formData.shippingLastName}
                          onChange={(e) => handleInputChange('shippingLastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingAddress.company">Company (Optional)</Label>
                      <Input
                        id="shippingCompany"
                        value={formData.shippingCompany}
                        onChange={(e) => handleInputChange('shippingCompany', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingAddress.address1">Address Line 1 *</Label>
                      <Input
                        id="shippingAddress1"
                        value={formData.shippingAddress1}
                        onChange={(e) => handleInputChange('shippingAddress1', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="shippingAddress.address2">Address Line 2 (Optional)</Label>
                      <Input
                        id="shippingAddress2"
                        value={formData.shippingAddress2}
                        onChange={(e) => handleInputChange('shippingAddress2', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="shippingAddress.city">City *</Label>
                        <Input
                          id="shippingCity"
                          value={formData.shippingCity}
                          onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.state">State/County *</Label>
                        <Input
                          id="shippingState"
                          value={formData.shippingState}
                          onChange={(e) => handleInputChange('shippingState', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.zipCode">Postal Code *</Label>
                        <Input
                          id="shippingZipCode"
                          value={formData.shippingZipCode}
                          onChange={(e) => handleInputChange('shippingZipCode', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shippingAddress.country">Country *</Label>
                        <Select value={formData.shippingCountry} onValueChange={(value) => handleInputChange('shippingCountry', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="shippingAddress.phone">Phone (Optional)</Label>
                        <Input
                          id="shippingPhone"
                          value={formData.shippingPhone}
                          onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back
                      </Button>
                      <Button type="button" onClick={nextStep}>
                        Continue to Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment Method */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCardIcon className="w-5 h-5" />
                        <span>Payment Method</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                          <RadioGroupItem value="cash-on-delivery" id="cod" />
                          <Label htmlFor="cod" className="flex items-center space-x-2 cursor-pointer flex-1">
                            <TruckIcon className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Cash on Delivery (COD)</div>
                              <div className="text-sm text-gray-500">Pay when your order arrives</div>
                              <div className="text-sm text-blue-600">
                                Additional fee: {subtotal > 50 ? '£2.99' : '£7.99'}
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                          <RadioGroupItem value="credit-card" id="card" disabled />
                          <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer flex-1">
                            <CreditCardIcon className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Credit/Debit Card</div>
                              <div className="text-sm text-gray-500">Coming soon</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

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
                        <Label htmlFor="sameAsShipping">Billing address same as shipping</Label>
                      </div>

                      {!sameAsShipping && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="billingAddress.firstName">First Name *</Label>
                              <Input
                                id="billingFirstName"
                                value={formData.billingFirstName}
                                onChange={(e) => handleInputChange('billingFirstName', e.target.value)}
                                required={!sameAsShipping}
                              />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress.lastName">Last Name *</Label>
                              <Input
                                id="billingLastName"
                                value={formData.billingLastName}
                                onChange={(e) => handleInputChange('billingLastName', e.target.value)}
                                required={!sameAsShipping}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="billingAddress.address1">Address Line 1 *</Label>
                            <Input
                              id="billingAddress1"
                              value={formData.billingAddress1}
                              onChange={(e) => handleInputChange('billingAddress1', e.target.value)}
                              required={!sameAsShipping}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="billingAddress.city">City *</Label>
                              <Input
                                id="billingCity"
                                value={formData.billingCity}
                                onChange={(e) => handleInputChange('billingCity', e.target.value)}
                                required={!sameAsShipping}
                              />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress.state">State/County *</Label>
                              <Input
                                id="billingState"
                                value={formData.billingState}
                                onChange={(e) => handleInputChange('billingState', e.target.value)}
                                required={!sameAsShipping}
                              />
                            </div>
                            <div>
                              <Label htmlFor="billingAddress.zipCode">Postal Code *</Label>
                              <Input
                                id="billingZipCode"
                                value={formData.billingZipCode}
                                onChange={(e) => handleInputChange('billingZipCode', e.target.value)}
                                required={!sameAsShipping}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={prevStep}>
                          Back
                        </Button>
                        <Button type="button" onClick={nextStep}>
                          Review Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4: Review Order */}
              {currentStep === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Review Your Order</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2">Contact Information</h4>
                        <p>{formData.guestName}</p>
                        <p>{formData.guestEmail}</p>
                        {formData.guestPhone && <p>{formData.guestPhone}</p>}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Shipping Address</h4>
                        <p>{formData.shippingFirstName} {formData.shippingLastName}</p>
                        <p>{formData.shippingAddress1}</p>
                        {formData.shippingAddress2 && <p>{formData.shippingAddress2}</p>}
                        <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZipCode}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Payment Method</h4>
                      <p className="text-sm">
                        {formData.paymentMethod === 'cash-on-delivery' ? 'Cash on Delivery (COD)' : formData.paymentMethod.replace('-', ' ').toUpperCase()}
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? 'Processing...' : `Place Order - £${total.toFixed(2)}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name || item.name}</p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>VAT (20%)</span>
                      <span>£{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold border-t pt-2">
                      <span>Total</span>
                      <span>£{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>Your order is secure and protected</span>
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

export default GuestCheckoutPage
