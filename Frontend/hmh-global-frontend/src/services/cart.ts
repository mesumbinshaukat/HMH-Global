import api from '../lib/api'
import { Cart, CartUpdateRequest, ApiResponse } from '../types'

export const cartService = {
  async getCart(): Promise<ApiResponse<Cart>> {
    return api.get('/api/cart')
  },

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<Cart>> {
    return api.post('/api/cart/add', { productId, quantity })
  },

  async updateCart(data: CartUpdateRequest): Promise<ApiResponse<Cart>> {
    return api.put('/api/cart/update', data)
  },

  async removeFromCart(productId: string): Promise<ApiResponse<Cart>> {
    return api.delete(`/api/cart/remove/${productId}`)
  },

  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    return api.delete('/api/cart/clear')
  }
}
