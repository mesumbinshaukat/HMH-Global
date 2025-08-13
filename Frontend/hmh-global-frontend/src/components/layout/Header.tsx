import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Menu, X, ChevronDown, User, Heart, Sparkles, Zap, Shield } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import SearchModal from '../search/SearchModal'
import { useAuthStore, useUIStore } from '../../store'
import { useCart } from '../../hooks/useQuery'
import { Badge } from '../ui/badge'
import { useCategories } from '../../hooks/useQuery'
import { Category } from '../../types'
import logo from '../../logo.jpeg'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore()
  const { data: cartData } = useCart()
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.data || []
  const [categoryMenuOpen, setCategoryMenuOpen] = React.useState(false)
  const [categorySearch, setCategorySearch] = React.useState('')
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [searchFocused, setSearchFocused] = React.useState(false)
  const [isSubscribeOpen, setIsSubscribeOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [subscribeEmail, setSubscribeEmail] = React.useState('')

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Filtered categories for search
  const filteredCategories = React.useMemo(() => {
    if (!categorySearch.trim()) return categories
    return categories.filter((cat: Category) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
  }, [categories, categorySearch])

  // Split categories into columns for mega menu
  const columns = 4
  const chunkedCategories = []
  for (let i = 0; i < filteredCategories.length; i += Math.ceil(filteredCategories.length / columns)) {
    chunkedCategories.push(filteredCategories.slice(i, i + Math.ceil(filteredCategories.length / columns)))
  }

  // Add fade-in animation and keyboard accessibility for mega menu
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (categoryMenuOpen && (e.key === 'Escape' || e.key === 'Tab')) {
        setCategoryMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [categoryMenuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const cartItemCount = cartData?.data?.items?.length || 0

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-premium-lg border-b border-baby-pink-200' 
        : 'bg-transparent'
    }`}>
      {/* Enhanced Top Bar - Smaller height like Mindrevive */}
      <div className="bg-gradient-to-r from-baby-pink-400 via-baby-pink-500 to-baby-pink-600 text-white py-2 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center space-x-6">
              <span className="flex items-center group">
                <span className="w-2 h-2 bg-commando-green-500 rounded-full mr-2 group-hover:scale-150 transition-transform duration-300"></span>
              <span className="group-hover:text-commando-green-200 transition-colors duration-300">Free Shipping on Orders Over £50</span>
              </span>
              <span className="hidden md:flex items-center group">
                <span className="w-2 h-2 bg-commando-green-500 rounded-full mr-2 group-hover:scale-150 transition-transform duration-300"></span>
                <span className="group-hover:text-commando-green-200 transition-colors duration-300">Premium Quality Guaranteed</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden md:block group">
                <span className="transition-colors duration-300">Customer Support: 1-800-HMH-GLOBAL</span>
              </span>
              <span className="text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-full">🇬🇧 GBP</span>
              <Button
                variant="secondary"
                className="ml-2 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full h-6 px-3 text-xs font-bold"
                onClick={() => setIsSubscribeOpen(true)}
                type="button"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Header - Smaller height like Mindrevive */}
      <div className={`transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative overflow-hidden rounded-xl p-2 bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 transition-all duration-500 group-hover:scale-110 group-hover:shadow-premium-lg group-hover:rotate-3">
                <div className="absolute inset-0 bg-gradient-to-br from-baby-pink-400/20 to-baby-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src={logo} alt="HMH Global" className="h-8 w-8 object-cover relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-baby-pink-400 to-baby-pink-600 rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              </div>
              <div className="hidden sm:block flex-shrink-1 min-w-0">
                <div className="text-base font-black text-commando-green-500 tracking-tight group-hover:text-commando-green-600 transition-colors duration-500 truncate">
                  HMH Global
                </div>
                <div className="text-xs text-commando-green-700 uppercase tracking-wider font-bold group-hover:text-commando-green-500 transition-colors duration-500 truncate">
                  Premium Lifestyle
                </div>
              </div>
            </Link>

            {/* Desktop Search Icon */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8 justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 w-10 h-10 rounded-full transition-all duration-300"
                onClick={() => setIsSearchOpen(true)}
                type="button"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* Enhanced Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Enhanced Categories Mega Menu */}
              <div className="relative" onMouseEnter={() => setCategoryMenuOpen(true)} onMouseLeave={() => setCategoryMenuOpen(false)}>
                <button
                  className="nav-link flex items-center px-3 py-2 focus:outline-none uppercase tracking-wide text-sm relative group text-commando-green-500 hover:text-commando-green-600"
                  aria-haspopup="true"
                  aria-expanded={categoryMenuOpen}
                  type="button"
                >
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Categories 
                  <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:rotate-180" />
                </button>
                {categoryMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-[800px] bg-white shadow-premium-xl rounded-3xl border border-baby-pink-100 z-50 p-8 animate-fade-in backdrop-blur-md"
                    tabIndex={-1}
                    onBlur={() => setCategoryMenuOpen(false)}
                    aria-label="All categories mega menu"
                    role="menu"
                  >
                    <div className="mb-6 flex items-center">
                      <div className="search-bar flex-1 mr-4">
                        <Input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={e => setCategorySearch(e.target.value)}
                          className="bg-transparent border-0 text-commando-green-500 placeholder-gray-500 focus:ring-0 focus:border-0 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full">{filteredCategories.length} categories</span>
                    </div>
                    <div className="grid grid-cols-4 gap-8 max-h-[400px] overflow-y-auto">
                      {chunkedCategories.map((col, colIdx) => (
                        <ul key={colIdx} className="space-y-3">
                          {col.map((cat: Category) => (
                            <li key={cat._id || cat.id}>
                              <Link
                                to={`/products?category=${cat._id || cat.id}`}
                                className="block text-commando-green-800 hover:text-commando-green-600 text-sm font-bold truncate transition-all duration-300 py-2 px-3 rounded-xl hover:bg-baby-pink-50 hover:scale-105 hover:shadow"
                                onClick={() => setCategoryMenuOpen(false)}
                              >
                                {cat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Products Link */}
              <Link to="/products" className="nav-link px-3 py-2 relative group text-commando-green-500 hover:text-commando-green-600">
                <Zap className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Products
              </Link>
              
              {/* Enhanced User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link to="/orders" className="nav-link px-3 py-2 relative group">
                    <Shield className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Orders
                  </Link>
                  
                  <div className="relative group">
                    <Button variant="ghost" className="flex items-center space-x-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-full px-3 py-2 transition-all duration-300">
                      <User className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-bold text-sm">{user?.firstName}</span>
                    </Button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-premium-lg border border-baby-pink-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:scale-100 scale-95">
                      <Link to="/profile" className="block px-4 py-3 text-sm text-commando-green-800 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-t-2xl transition-all duration-300">
                        Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-3 text-sm text-commando-green-800 hover:text-commando-green-600 hover:bg-baby-pink-50 transition-all duration-300">
                          Admin Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-b-2xl transition-all duration-300"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 font-bold uppercase tracking-wide text-sm rounded-full transition-all duration-300">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 hover:from-baby-pink-600 hover:to-baby-pink-700 text-white font-bold uppercase tracking-wide text-sm px-5 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-premium hover:shadow-premium-lg">
                      Join Now
                    </Button>
                  </Link>
                </div>
              )}

              {/* Enhanced Wishlist */}
              <Button variant="ghost" size="icon" className="text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 w-10 h-10 rounded-full transition-all duration-300 group">
                <Heart className="w-5 h-5 group-hover:scale-110 group-hover:fill-red-500 group-hover:text-red-500 transition-all duration-300" />
              </Button>

              {/* Enhanced Cart */}
              <Link to="/cart" className="relative group">
                <Button variant="ghost" size="icon" className="text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 w-10 h-10 rounded-full transition-all duration-300">
                  <ShoppingCart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 text-white border-2 border-white rounded-full font-bold shadow-premium animate-pulse">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>

            {/* Enhanced Mobile Menu Button */}
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 w-10 h-10 rounded-full transition-all duration-300">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-baby-pink-200 bg-white/95 backdrop-blur-md animate-slide-down">
            {/* Mobile Search Icon */}
            <div className="mb-4 px-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 w-10 h-10 rounded-full transition-all duration-300"
                onClick={() => setIsSearchOpen(true)}
                type="button"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Enhanced Mobile Categories */}
            <div className="mb-4 px-4">
              <button
                className="w-full flex items-center justify-between px-4 py-2 text-commando-green-500 bg-baby-pink-50 rounded-2xl font-bold focus:outline-none transition-all duration-300 hover:bg-baby-pink-100 hover:shadow-md"
                onClick={() => setCategoryMenuOpen(v => !v)}
                aria-expanded={categoryMenuOpen}
                type="button"
              >
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Categories
                </div>
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-300 ${categoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryMenuOpen && (
                <div className="mt-3 max-h-64 overflow-y-auto bg-white rounded-2xl shadow-premium border border-baby-pink-100 p-4">
                  <div className="search-bar mb-3">
                    <Input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className="bg-transparent border-0 text-commando-green-500 placeholder-gray-500 focus:ring-0 focus:border-0 rounded-full"
                    />
                  </div>
                  <ul className="space-y-2">
                    {filteredCategories.map((cat: Category) => (
                      <li key={cat._id || cat.id}>
                        <button
                          type="button"
                          className="block w-full text-left px-3 py-2 text-commando-green-700 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-xl text-sm font-bold truncate transition-all duration-300 hover:scale-105"
                          onClick={() => {
                            setCategoryMenuOpen(false);
                            closeMobileMenu();
                            navigate(`/products?category=${cat._id || cat.id}`);
                          }}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Enhanced Mobile Menu Items */}
            <div className="space-y-2 px-4">
              <Link 
                to="/products" 
                className="block px-4 py-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-2xl transition-all duration-300 font-bold flex items-center"
                onClick={closeMobileMenu}
              >
                <Zap className="w-4 h-4 mr-2" />
                Products
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/orders" 
                    className="block px-4 py-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-2xl transition-all duration-300 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Orders
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-2xl transition-all duration-300 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                  <Link 
                    to="/cart" 
                    className="block px-4 py-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-2xl transition-all duration-300 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart ({cartItemCount})
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-2xl transition-all duration-300 flex items-center"
                      onClick={closeMobileMenu}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all duration-300"
                    onClick={() => {
                      handleLogout()
                      closeMobileMenu()
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-4 py-2 text-commando-green-500 hover:text-commando-green-600 hover:bg-baby-pink-50 rounded-2xl transition-all duration-300 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-4 py-2 bg-gradient-to-r from-baby-pink-500 to-baby-pink-600 text-white font-bold rounded-2xl text-center transition-all duration-300 hover:shadow-premium"
                    onClick={closeMobileMenu}
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Subscription Modal */}
      <Dialog open={isSubscribeOpen} onOpenChange={setIsSubscribeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to Updates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Join our list to receive exclusive offers, product updates, and more.</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
              />
              <Button
                onClick={() => {
                  // TODO: integrate with backend newsletter endpoint
                  setIsSubscribeOpen(false)
                }}
                disabled={!subscribeEmail.trim()}
              >
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-gray-500">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </DialogContent>
      </Dialog>
      {/* Global Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}

export default Header
