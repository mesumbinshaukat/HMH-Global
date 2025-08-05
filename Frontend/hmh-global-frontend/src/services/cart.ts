import api from '../lib/api'
import { Cart, CartUpdateRequest, ApiResponse } from '../types'
import { toast } from 'sonner'

// Retry utility for cart operations
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 2): Promise<T> => {
  let lastError: Error = new Error('Operation failed')
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw lastError
}

const handleCartError = (error: any, operation: string) => {
  console.error(`Cart ${operation} failed:`, error)
  
  if (error.response?.status === 401) {
    toast.error('Please log in to continue')
    return
  }
  
  if (error.response?.status === 404) {
    toast.error('Item not found in cart')
    return
  }
  
  if (error.response?.status >= 500) {
    toast.error('Server error. Please try again later.')
    return
  }
  
  const message = error.response?.data?.message || `Failed to ${operation.toLowerCase()}`
  toast.error(message)
}

export const cartService = {
  async getCart(): Promise<ApiResponse<Cart>> {
    try {
      return await retryOperation(() => api.get('/api/cart'))
    } catch (error: any) {
      handleCartError(error, 'get cart')
      throw error
    }
  },

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<Cart>> {
    try {
      // Validate inputs
      if (!productId) {
        throw new Error('Product ID is required')
      }
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1')
      }
      
      return await retryOperation(() => 
        api.post('/api/cart/add', { productId, quantity })
      )
    } catch (error: any) {
      handleCartError(error, 'add to cart')
      throw error
    }
  },

  async updateCart(data: CartUpdateRequest): Promise<ApiResponse<Cart>> {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Update data is required')
      }
      
      return await retryOperation(() => 
        api.put('/api/cart/update', data)
      )
    } catch (error: any) {
      handleCartError(error, 'update cart')
      throw error
    }
  },

  async removeFromCart(productId: string): Promise<ApiResponse<Cart>> {
    try {
      if (!productId) {
        throw new Error('Product ID is required')
      }
      
      return await retryOperation(() => 
        api.delete(`/api/cart/remove/${productId}`)
      )
    } catch (error: any) {
      handleCartError(error, 'remove from cart')
      throw error
    }
  },

  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    try {
      return await retryOperation(() => api.delete('/api/cart/clear'))
    } catch (error: any) {
      handleCartError(error, 'clear cart')
      throw error
    }
  },

  async updateCartItem(productId: string, quantity: number): Promise<ApiResponse<Cart>> {
    try {
      if (!productId) {
        throw new Error('Product ID is required')
      }
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative')
      }
      
      return await retryOperation(() => 
        api.put(`/api/cart/item/${productId}`, { quantity })
      )
    } catch (error: any) {
      handleCartError(error, 'update cart item')
      throw error
    }
  },

  async applyCoupon(code: string): Promise<ApiResponse<{ discount: number; message: string }>> {
    try {
      if (!code || !code.trim()) {
        throw new Error('Coupon code is required')
      }
      
      return await retryOperation(() => 
        api.post('/api/cart/coupon', { code: code.trim().toUpperCase() })
      )
    } catch (error: any) {
      // Don't show generic error for coupon failures - they're user-facing
      if (error.response?.status !== 400) {
        handleCartError(error, 'apply coupon')
      }
      throw error
    }
  },

  // New utility methods
  async syncCart(): Promise<ApiResponse<Cart> | null> {
    try {
      return await this.getCart()
    } catch (error) {
      console.warn('Failed to sync cart:', error)
      return null
    }
  },

  validateCartItem(productId: string, quantity: number): { isValid: boolean; error?: string } {
    if (!productId) {
      return { isValid: false, error: 'Product ID is required' }
    }
    
    if (quantity < 1) {
      return { isValid: false, error: 'Quantity must be at least 1' }
    }
    
    if (quantity > 99) {
      return { isValid: false, error: 'Maximum quantity is 99' }
    }
    
    return { isValid: true }
  }
}
