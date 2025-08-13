import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircleIcon, MailIcon, ShoppingBagIcon, ArrowRightIcon } from 'lucide-react'

const OrderSuccessPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { orderNumber, email } = location.state || {}

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your order information.</p>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">Thank you for your purchase</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingBagIcon className="w-5 h-5" />
              <span>Order Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Number:</span>
                <span className="font-semibold text-lg">{orderNumber}</span>
              </div>
            </div>
            
            {email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MailIcon className="w-4 h-4" />
                <span>A confirmation email has been sent to {email}</span>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>We'll process your order within 1-2 business days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>You'll receive a tracking notification once shipped</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>For Cash on Delivery orders, have exact payment ready</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-1">Need help?</h4>
              <p className="text-sm text-blue-800">
                If you have any questions about your order, please contact us at{' '}
                <a href="mailto:support@hmhglobal.co.uk" className="underline">
                  support@hmhglobal.co.uk
                </a>{' '}
                or call us at +44 161 278 3153.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => navigate('/products')} 
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <ArrowRightIcon className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Order placed on {new Date().toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
