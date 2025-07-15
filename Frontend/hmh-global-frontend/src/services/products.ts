import api from '../lib/api'
import { Product, ProductFilters, ApiResponse, PaginatedResponse } from '../types'

export const productService = {
  async getProducts(filters?: ProductFilters, page = 1, limit = 12): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }
    
    return api.get(`/api/products?${params}`)
  },

  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    return api.get('/api/products/featured')
  },

  async searchProducts(query: string, page = 1, limit = 12): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return api.get(`/api/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
  },

  async getProductsByCategory(categoryId: string, page = 1, limit = 12): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return api.get(`/api/products/category/${categoryId}?page=${page}&limit=${limit}`)
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return api.get(`/api/products/${id}`)
  },

  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return api.post('/api/products', data)
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return api.put(`/api/products/${id}`, data)
  },

  async deleteProduct(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/api/products/${id}`)
  },

  async updateInventory(id: string, quantity: number): Promise<ApiResponse<Product>> {
    return api.patch(`/api/products/${id}/inventory`, { quantity })
  },

  async uploadProductImage(id: string, file: File): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData()
    formData.append('image', file)
    
    return api.post(`/api/products/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
