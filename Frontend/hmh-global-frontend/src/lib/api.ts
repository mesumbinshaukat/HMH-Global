import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'

class ApiService {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Always send cookies (for sessionId)
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
        if (config.headers.Authorization) {
          console.log(`[API] Auth header: ${config.headers.Authorization}`)
        }
        if (config.data) {
          console.log('[API] Request data:', config.data)
        }
        return config
      },
      (error) => {
        console.error('[API] Request error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`[API] Response: ${response.status} ${response.config.url}`)
        if (response.data) {
          console.log('[API] Response data:', response.data)
        }
        return response
      },
      (error) => {
        if (error.response?.status === 401) {
          console.log('[API] 401 Unauthorized - clearing token and redirecting to /login')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        const message = error.response?.data?.message || error.message || 'An error occurred'
        toast.error(message)
        console.error(`[API] Error: ${message} (${error.config?.url})`, error)
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config)
    return response.data
  }

  setAuthToken(token: string) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  removeAuthToken() {
    delete this.instance.defaults.headers.common['Authorization']
  }
}

export const api = new ApiService()
export default api
