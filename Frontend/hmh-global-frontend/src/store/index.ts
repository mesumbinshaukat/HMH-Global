import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Cart } from '../types'
import { authService } from '../services/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

interface CartState {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  setCart: (cart: Cart | null) => void
  clearCart: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addItem: (productId: string, quantity: number) => void
  updateItem: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  getItemCount: () => number
  getTotalPrice: () => number
}

interface UIState {
  isMobileMenuOpen: boolean
  isCartOpen: boolean
  isSearchOpen: boolean
  toggleMobileMenu: () => void
  toggleCart: () => void
  toggleSearch: () => void
  closeMobileMenu: () => void
  closeCart: () => void
  closeSearch: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, token) => {
        authService.setAuth(token, user)
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        authService.logout()
        set({ user: null, isAuthenticated: false })
      },
      updateUser: (userData) => {
        set((state) => {
          if (state.user) {
            const updatedUser = { ...state.user, ...userData }
            localStorage.setItem('user', JSON.stringify(updatedUser))
            return { user: updatedUser }
          }
          return state
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,
      setCart: (cart) => set({ cart, error: null }),
      clearCart: () => set({ cart: null, error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      addItem: (productId, quantity) => {
        const state = get()
        if (!state.cart) return
        
        const existingItem = state.cart.items.find(item => item.productId === productId)
        if (existingItem) {
          // Update existing item
          const updatedItems = state.cart.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
          set({
            cart: {
              ...state.cart,
              items: updatedItems
            }
          })
        } else {
          // Add new item (this would need product data)
          console.warn('Adding new cart item requires product data. Use API instead.')
        }
      },
      updateItem: (productId, quantity) => {
        const state = get()
        if (!state.cart) return
        
        if (quantity <= 0) {
          // Remove item
          const updatedItems = state.cart.items.filter(item => item.productId !== productId)
          set({
            cart: {
              ...state.cart,
              items: updatedItems
            }
          })
        } else {
          // Update quantity
          const updatedItems = state.cart.items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
          set({
            cart: {
              ...state.cart,
              items: updatedItems
            }
          })
        }
      },
      removeItem: (productId) => {
        const state = get()
        if (!state.cart) return
        
        const updatedItems = state.cart.items.filter(item => item.productId !== productId)
        set({
          cart: {
            ...state.cart,
            items: updatedItems
          }
        })
      },
      getItemCount: () => {
        const state = get()
        if (!state.cart) return 0
        return state.cart.items.reduce((total, item) => total + item.quantity, 0)
      },
      getTotalPrice: () => {
        const state = get()
        if (!state.cart) return 0
        return state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
)

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isCartOpen: false,
  isSearchOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  closeCart: () => set({ isCartOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
}))

// Initialize auth state from localStorage
const initializeAuth = () => {
  const token = authService.getToken()
  const user = authService.getUser()
  
  if (token && user) {
    useAuthStore.getState().login(user, token)
  }
}

// Call on app start
initializeAuth()
