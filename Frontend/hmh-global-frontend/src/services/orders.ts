import api from '../lib/api'
import { Order, CheckoutRequest, ApiResponse, PaginatedResponse } from '../types'

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

  async getAllOrders(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    return api.get(`/api/orders?${query.toString()}`);
  },

  async bulkUpdateOrderStatus(orderIds: string[], status: string): Promise<ApiResponse<any>> {
    return api.post('/api/orders/bulk-status', { orderIds, status });
  },
  async bulkDeleteOrders(orderIds: string[]): Promise<ApiResponse<any>> {
    return api.post('/api/orders/bulk-delete', { orderIds });
  },
  async exportOrders(params?: { format?: 'csv' | 'excel'; status?: string; search?: string }): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.format) query.append('format', params.format);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    // Use api.getBlob instead of api.instance.get
    const response = await api.getBlob(`/api/orders/export?${query.toString()}`);
    return response.data;
  }
}
