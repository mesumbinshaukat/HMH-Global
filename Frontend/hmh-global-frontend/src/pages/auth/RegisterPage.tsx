import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import { registerSchema, RegisterFormData } from '../../lib/validations'
import { authService } from '../../services/auth'
import { toast } from 'sonner'
import { Eye, EyeOff, UserPlus, Sparkles, Shield, CheckCircle2, Mail, User, Lock } from 'lucide-react'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [subscribeMail, setSubscribeMail] = React.useState(true)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) {
      toast.error('Please accept the Terms of Service to continue')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })
      if (response.success && response.data) {
        toast.success('Account created successfully. Please sign in to continue.')
        navigate('/login', { replace: true })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Register - HMH Global</title>
        <meta name="description" content="Create your HMH Global account" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-baby-pink-50 via-white to-baby-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-baby-pink-200/20 to-transparent"></div>
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-baby-pink-300/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-baby-pink-400/5 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-lg shadow-premium border-0 bg-white/95 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 rounded-2xl flex items-center justify-center shadow-premium">
                <UserPlus className="w-8 h-8 text-hmh-black-900" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black text-hmh-black-900 mb-2">
              Join <span className="text-gradient">HMH Global</span>
            </CardTitle>
            <p className="text-hmh-black-600 text-lg">Create your premium account today</p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-bold text-hmh-black-900 flex items-center">
                    <User className="w-4 h-4 mr-2 text-baby-pink-600" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    {...form.register('firstName')}
                    className={`border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 h-12 ${form.formState.errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-bold text-hmh-black-900 flex items-center">
                    <User className="w-4 h-4 mr-2 text-baby-pink-600" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    {...form.register('lastName')}
                    className={`border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 h-12 ${form.formState.errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-red-500 text-sm flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-hmh-black-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-baby-pink-600" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...form.register('email')}
                  className={`border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 h-12 ${form.formState.errors.email ? 'border-red-500' : ''}`}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-hmh-black-900 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-baby-pink-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...form.register('password')}
                    className={`border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 h-12 pr-12 ${form.formState.errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-baby-pink-600 hover:text-baby-pink-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-hmh-black-900 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-baby-pink-600" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...form.register('confirmPassword')}
                    className={`border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 h-12 pr-12 ${form.formState.errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-baby-pink-600 hover:text-baby-pink-700 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms and Newsletter */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="acceptTerms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    className="mt-0.5 border-baby-pink-500 data-[state=checked]:bg-baby-pink-500"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm text-hmh-black-700 leading-5">
                    I agree to the{' '}
                    <Link to="/terms" className="text-baby-pink-600 hover:text-baby-pink-700 font-medium underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-baby-pink-600 hover:text-baby-pink-700 font-medium underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="subscribeMail" 
                    checked={subscribeMail}
                    onCheckedChange={(checked) => setSubscribeMail(checked === true)}
                    className="mt-0.5 border-baby-pink-500 data-[state=checked]:bg-baby-pink-500"
                  />
                  <Label htmlFor="subscribeMail" className="text-sm text-hmh-black-700 leading-5">
                    Subscribe to our newsletter for exclusive offers and updates
                  </Label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white font-bold text-lg shadow-premium transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                disabled={isLoading || !acceptTerms}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-hmh-black-900/20 border-t-hmh-black-900 rounded-full animate-spin mr-3"></div>
                    Creating your account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Premium Account
                  </div>
                )}
              </Button>
            </form>
            
            {/* Social Login Options */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-hmh-black-600 font-medium">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 border-gray-200 hover:bg-gray-50 text-hmh-black-700 font-medium"
                  onClick={() => toast.info('Google signup coming soon!')}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 border-gray-200 hover:bg-gray-50 text-hmh-black-700 font-medium"
                  onClick={() => toast.info('Facebook signup coming soon!')}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-hmh-black-600">
                Already have an account?{' '}
                <Link to="/login" className="text-baby-pink-600 hover:text-baby-pink-700 font-bold transition-colors underline">
                  Sign in here
                </Link>
              </p>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center space-x-6 text-xs text-hmh-black-500">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1 text-baby-pink-500" />
                  Secure
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-baby-pink-500" />
                  Verified
                </div>
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-1 text-baby-pink-500" />
                  Premium
                </div>
              </div>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default RegisterPage
