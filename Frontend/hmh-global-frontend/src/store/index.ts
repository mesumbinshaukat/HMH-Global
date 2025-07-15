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
  setCart: (cart: Cart) => void
  clearCart: () => void
  setLoading: (loading: boolean) => void
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

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: null }),
  setLoading: (loading) => set({ isLoading: loading }),
}))

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
