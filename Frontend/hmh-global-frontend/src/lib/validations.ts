import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
})

export const addressSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  company: z.string().optional(),
  street: z.string().min(5, 'Street address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  phone: z.string().optional(),
})

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: z.string().min(1, 'Please select a payment method'),
  sameAsShipping: z.boolean().optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
})

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  salePrice: z.number().optional(),
  categoryId: z.string().min(1, 'Please select a category'),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type AddressFormData = z.infer<typeof addressSchema>
export type CheckoutFormData = z.infer<typeof checkoutSchema>
export type ReviewFormData = z.infer<typeof reviewSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
