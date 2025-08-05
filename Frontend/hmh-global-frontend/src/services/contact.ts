import { api } from '../lib/api'

export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  subject: string
  message: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: 'general' | 'support' | 'sales' | 'complaint' | 'partnership' | 'other'
}

export interface Contact extends ContactFormData {
  _id: string
  status: 'new' | 'in-progress' | 'resolved' | 'closed'
  isRead: boolean
  adminNotes?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

export interface ContactResponse {
  success: boolean
  message: string
  data?: Contact
}

export interface ContactListResponse {
  success: boolean
  data: Contact[]
}

export const contactService = {
  // Create a new contact message
  async createContact(data: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await api.post<ContactResponse>('/api/contact', data)
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send message')
    }
  },

  // Get all contact messages (Admin only)
  async getContacts(): Promise<ContactListResponse> {
    try {
      const response = await api.get<ContactListResponse>('/api/contact')
      return response
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch messages')
    }
  }
}

export default contactService
