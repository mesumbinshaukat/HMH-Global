import api from '../lib/api'
import { Order, CheckoutRequest, ApiResponse } from '../types'

export const orderService = {
  async createOrder(data: CheckoutRequest): Promise<ApiResponse<Order>> {
    return api.post('/api/orders', data)
  },

  async getMyOrders(): Promise<ApiResponse<Order[]>> {
    return api.get('/api/orders/my-orders')
  },

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return api.get(`/api/orders/${id}`)
  },

  async cancelOrder(id: string): Promise<ApiResponse<Order>> {
    return api.patch(`/api/orders/${id}/cancel`)
  },

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    return api.patch(`/api/orders/${id}/status`, { status })
  },

  async getAllOrders(): Promise<ApiResponse<Order[]>> {
    return api.get('/api/orders')
  }
}
