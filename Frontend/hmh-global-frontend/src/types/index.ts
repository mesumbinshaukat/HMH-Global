export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'customer'
  profilePicture?: string
  createdAt: string
  updatedAt: string
  isEmailVerified: boolean
}

export interface Category {
  id: string
  _id?: string
  name: string
  description?: string
  parentId?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  _id?: string
  name: string
  description: string
  price: number
  salePrice?: number
  images: string[]
  categoryId: string
  category?: Category
  brand?: string
  tags: string[]
  specifications: Record<string, any>
  stockQuantity: number
  isActive: boolean
  isFeatured: boolean
  averageRating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
  createdAt: string
  updatedAt: string
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  userId: string
  user?: User
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product: Product
  quantity: number
  price: number
  createdAt: string
  updatedAt: string
}

export interface Address {
  id?: string
  firstName: string
  lastName: string
  company?: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
}

export interface Review {
  id: string
  userId: string
  user: User
  productId: string
  rating: number
  title: string
  comment: string
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current: string
    hasNext: boolean
    hasPrev: boolean
    pages: number
    total: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ProductFilters {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  brand?: string
  tags?: string[]
  sortBy?: 'price' | 'name' | 'rating' | 'newest'
  sortOrder?: 'asc' | 'desc'
}

export interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  recentOrders: Order[]
  topProducts: Product[]
}

export interface CartUpdateRequest {
  productId: string
  quantity: number
}

export interface CheckoutRequest {
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: string
}
