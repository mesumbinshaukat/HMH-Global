import api from '../lib/api'
import { Review, ApiResponse } from '../types'

export const reviewService = {
  async getProductReviews(productId: string): Promise<ApiResponse<Review[]>> {
    return api.get(`/api/reviews/product/${productId}`)
  },

  async createReview(data: Partial<Review>): Promise<ApiResponse<Review>> {
    return api.post('/api/reviews', data)
  },

  async addReview(productId: string, data: { rating: number; title: string; comment: string }): Promise<ApiResponse<Review>> {
    return api.post(`/api/reviews/product/${productId}`, data)
  },

  async updateReview(id: string, data: Partial<Review>): Promise<ApiResponse<Review>> {
    return api.put(`/api/reviews/${id}`, data)
  },

  async deleteReview(id: string): Promise<ApiResponse<{ message: string }>> {
    return api.delete(`/api/reviews/${id}`)
  },

  async markReviewHelpful(id: string): Promise<ApiResponse<Review>> {
    return api.patch(`/api/reviews/${id}/helpful`)
  }
}
