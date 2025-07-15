import api from '../lib/api'
import { Category, ApiResponse } from '../types'

export const categoryService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return api.get('/api/categories')
  },

  async createCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
    return api.post('/api/categories', data)
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<ApiResponse<Category>> {
    return api.put(`/api/categories/${id}`, data)
  },

  async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/api/categories/${id}`)
  }
}
