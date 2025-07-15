import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  productService, 
  authService, 
  cartService, 
  orderService, 
  categoryService, 
  reviewService 
} from '../services'
import { ProductFilters } from '../types'
import { useCartStore } from '../store'

// Product hooks
export const useProducts = (filters?: ProductFilters, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', filters, page, limit],
    queryFn: () => productService.getProducts(filters, page, limit),
  })
}

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeaturedProducts(),
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  })
}

export const useSearchProducts = (query: string, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', 'search', query, page, limit],
    queryFn: () => productService.searchProducts(query, page, limit),
    enabled: !!query,
  })
}

export const useProductsByCategory = (categoryId: string, page = 1, limit = 12) => {
  return useQuery({
    queryKey: ['products', 'category', categoryId, page, limit],
    queryFn: () => productService.getProductsByCategory(categoryId, page, limit),
    enabled: !!categoryId,
  })
}

// Category hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  })
}

// Cart hooks
export const useCart = () => {
  const setCart = useCartStore(state => state.setCart)
  const setLoading = useCartStore(state => state.setLoading)
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      setLoading(true)
      try {
        const response = await cartService.getCart()
        setCart(response.data!)
        return response
      } finally {
        setLoading(false)
      }
    },
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addToCart(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart')
    },
  })
}

export const useUpdateCart = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cartService.updateCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cart')
    },
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cartService.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Removed from cart')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove from cart')
    },
  })
}

// Order hooks
export const useMyOrders = () => {
  return useQuery({
    queryKey: ['orders', 'my'],
    queryFn: () => orderService.getMyOrders(),
  })
}

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Order placed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place order')
    },
  })
}

// Review hooks
export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', 'product', productId],
    queryFn: () => reviewService.getProductReviews(productId),
    enabled: !!productId,
  })
}

export const useCreateReview = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: reviewService.createReview,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'product', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
      toast.success('Review submitted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    },
  })
}

// Auth hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })
}
