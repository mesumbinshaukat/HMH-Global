import api from '../lib/api';
import { Product, Order, User } from '../types';

export interface AdminMetrics {
  ordersByStatus: Array<{ _id: string; count: number; revenue: number }>;
  dailyRevenue: Array<{ _id: { year: number; month: number; day: number }; revenue: number; orders: number }>;
  userRegistrations: Array<{ _id: { year: number; month: number; day: number }; count: number }>;
  topProducts: Array<{ _id: string; quantity: number; revenue: number; product: Product }>;
  timeframe: string;
}

export interface AdminStats {
  users: number;
  products: number;
  orders: number;
  revenue: number;
}

class AdminService {
  // Dashboard stats and metrics
  async getStats(): Promise<AdminStats> {
    const response = await api.get<any>('/api/admin/stats');
    return response.data;
  }

  async getMetrics(timeframe: string = '7d'): Promise<AdminMetrics> {
    const response = await api.get<any>(`/api/admin/metrics?timeframe=${timeframe}`);
    return response.data;
  }

  // Scraper management
  async startScraper(): Promise<any> {
    const response = await api.post<any>('/api/admin/scrape-northwest');
    return response.data;
  }

  // Order management
  async getAllOrders(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get<any>(`/api/admin/orders?${queryParams}`);
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await api.put<any>(`/api/admin/orders/${orderId}/status`, { status });
    return response.data.data;
  }

  async bulkUpdateOrderStatus(orderIds: string[], status: string): Promise<any> {
    const response = await api.post<any>('/api/admin/orders/bulk-update', { orderIds, status });
    return response.data;
  }

  async bulkDeleteOrders(orderIds: string[]): Promise<any> {
    const response = await api.post<any>('/api/admin/orders/bulk-delete', { orderIds });
    return response.data;
  }

  async exportOrders(params: any = {}): Promise<Blob> {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get<any>(`/api/admin/orders/export?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async generateInvoice(orderId: string): Promise<string> {
    const response = await api.get<any>(`/api/admin/orders/${orderId}/invoice`, {
      responseType: 'text'
    });
    return response.data;
  }

  // Product management
  async createProduct(formData: FormData): Promise<Product> {
    const response = await api.post<any>('/api/admin/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }

  async updateProduct(productId: string, formData: FormData): Promise<Product> {
    const response = await api.put<any>(`/api/admin/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }

  async deleteProduct(productId: string): Promise<any> {
    const response = await api.delete<any>(`/api/admin/products/${productId}`);
    return response.data;
  }

  async bulkImportProducts(csvFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('csv', csvFile);
    const response = await api.post<any>('/api/admin/products/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async exportProducts(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await api.get<any>(`/api/admin/products/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // User management
  async getAllUsers(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get<any>(`/api/admin/users?${queryParams}`);
    return response.data;
  }

  async toggleUserRole(userId: string, role: string): Promise<User> {
    const response = await api.put<any>(`/api/admin/users/${userId}/role`, { role });
    return response.data.data;
  }

  async impersonateUser(userId: string): Promise<any> {
    const response = await api.post<any>(`/api/admin/users/${userId}/impersonate`);
    return response.data;
  }
}

export const adminService = new AdminService();
