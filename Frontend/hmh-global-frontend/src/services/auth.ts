import api from '../lib/api'
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  ApiResponse 
} from '../types'

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return api.post('/api/users/login', data)
  },

  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    // Transform frontend data to match backend expectations
    const backendData = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: data.password,
      role: 'customer' // Default role for registration
    }
    return api.post('/api/users/register', backendData)
  },

  async verifyEmail(token: string): Promise<ApiResponse<{ user: User }>> {
    return api.get(`/api/users/verify-email/${token}`)
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return api.post('/api/users/forgot-password', data)
  },

  async resetPassword(token: string, data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return api.post(`/api/users/reset-password/${token}`, data)
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return api.get('/api/users/profile')
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return api.put('/api/users/update', data)
  },

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return api.get('/api/users/all-users')
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    api.removeAuthToken()
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  setAuth(token: string, user: User) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    api.setAuthToken(token)
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  isAdmin(): boolean {
    const user = this.getUser()
    return user?.role === 'admin'
  }
}
