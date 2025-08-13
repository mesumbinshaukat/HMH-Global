import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { loginSchema, LoginFormData } from '../../lib/validations'
import { authService } from '../../services/auth'
import { useAuthStore } from '../../store'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect } from 'react'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, login } = useAuthStore()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data)
      if (response.success && response.data) {
        login(response.data.user, response.data.token)
        toast.success('Welcome back!')
        // Debug logs
        console.log('[LoginPage] onSubmit: user', response.data.user)
        // Redirect admin to admin dashboard, others to previous or home
        if (response.data.user.role === 'admin') {
          console.log('[LoginPage] onSubmit: Redirecting to /admin')
          navigate('/admin', { replace: true })
          console.log('[LoginPage] onSubmit: After navigate')
        } else {
          const from = location.state?.from?.pathname || '/'
          navigate(from, { replace: true })
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Ensure admin is redirected if already authenticated
  useEffect(() => {
    console.log('[LoginPage] useEffect: isAuthenticated', isAuthenticated, 'user', user)
    if (isAuthenticated && user?.role === 'admin') {
      console.log('[LoginPage] useEffect: Redirecting to /admin')
      navigate('/admin', { replace: true })
      console.log('[LoginPage] useEffect: After navigate')
    }
  }, [isAuthenticated, user, navigate])

  return (
    <>
      <Helmet>
        <title>Login - HMH Global</title>
        <meta name="description" content="Login to your HMH Global account" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md card-premium">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-commando-green-900">Sign in to HMH Global</CardTitle>
            <p className="text-commando-green-600 mt-2">Welcome back! Please sign in to your account</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-commando-green-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...form.register('email')}
                  className={`border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500 ${
                    form.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                  }`}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-commando-green-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...form.register('password')}
                    className={`pr-10 border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500 ${
                      form.formState.errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3 text-commando-green-500 hover:text-commando-green-700 hover:bg-commando-green-50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white rounded-full py-3 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-commando-green-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-baby-pink-600 hover:text-baby-pink-700 font-semibold underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default LoginPage

