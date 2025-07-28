import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Menu, X, ChevronDown, User, Heart } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 text-hmh-black-900 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center space-x-6">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-hmh-black-900 rounded-full mr-2"></span>
                Free Shipping on Orders Over $50
              </span>
              <span className="hidden md:flex items-center">
                <span className="w-2 h-2 bg-hmh-black-900 rounded-full mr-2"></span>
                Premium Quality Guaranteed
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden md:block">Customer Support: 1-800-HMH-GLOBAL</span>
              <span className="text-xs">🇺🇸 USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="relative overflow-hidden rounded-xl p-2 bg-gradient-to-br from-hmh-gold-100 to-hmh-gold-200 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <img src={logo} alt="HMH Global" className="h-12 w-12 object-cover" />
              </div>
              <div className="hidden sm:block">
                <div className="text-2xl font-black text-hmh-black-900 tracking-tight group-hover:text-hmh-gold-600 transition-colors duration-300">
                  HMH Global
                </div>
                <div className="text-xs text-hmh-black-600 uppercase tracking-wider font-medium">
                  Premium Lifestyle
                </div>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="w-full relative group">
                <Input
                  type="text"
                  placeholder="Search for premium products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 bg-gray-50 border-gray-200 text-hmh-black-900 placeholder-gray-500 focus:border-hmh-gold-500 focus:ring-hmh-gold-500 rounded-full h-12 transition-all duration-300 group-hover:bg-white group-hover:shadow-md"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-hmh-gold-500 hover:bg-hmh-gold-600 text-hmh-black-900 rounded-full h-8 w-8 p-0 transition-all duration-300 hover:scale-110"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Categories Mega Menu */}
              <div className="relative" onMouseEnter={() => setCategoryMenuOpen(true)} onMouseLeave={() => setCategoryMenuOpen(false)}>
                <button
                  className="flex items-center text-hmh-black-900 hover:text-hmh-gold-600 transition-colors font-semibold px-4 py-3 focus:outline-none uppercase tracking-wide text-sm relative group"
                  aria-haspopup="true"
                  aria-expanded={categoryMenuOpen}
                  type="button"
                >
                  Categories 
                  <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:rotate-180" />
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-hmh-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </button>
                {categoryMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-[800px] bg-white shadow-2xl rounded-2xl border border-gray-100 z-50 p-8 animate-fade-in backdrop-blur-md"
                    tabIndex={-1}
                    onBlur={() => setCategoryMenuOpen(false)}
                    aria-label="All categories mega menu"
                    role="menu"
                  >
                    <div className="mb-6 flex items-center">
                      <Input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                        className="w-64 mr-4 bg-gray-50 border-gray-200 text-hmh-black-900 placeholder-gray-500 focus:border-hmh-gold-500 focus:ring-hmh-gold-500 rounded-full"
                      />
                      <span className="text-xs text-gray-500 font-medium">{filteredCategories.length} categories</span>
                    </div>
                    <div className="grid grid-cols-4 gap-8 max-h-[400px] overflow-y-auto">
                      {chunkedCategories.map((col, colIdx) => (
                        <ul key={colIdx} className="space-y-3">
                          {col.map((cat: Category) => (
                            <li key={cat._id || cat.id}>
                              <Link
                                to={`/products?category=${cat._id || cat.id}`}
                                className="block text-hmh-black-700 hover:text-hmh-gold-600 text-sm font-semibold truncate transition-all duration-200 py-2 px-3 rounded-lg hover:bg-hmh-gold-50"
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
              
              {/* Products Link */}
              <Link to="/products" className="text-hmh-black-900 hover:text-hmh-gold-600 transition-colors font-semibold uppercase tracking-wide text-sm px-4 py-3 relative group">
                Products
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-hmh-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </Link>
              
              {/* User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-6">
                  <Link to="/orders" className="text-hmh-black-900 hover:text-hmh-gold-600 transition-colors font-semibold uppercase tracking-wide text-sm px-4 py-3 relative group">
                    Orders
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-hmh-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </Link>
                  
                  <div className="relative group">
                    <Button variant="ghost" className="flex items-center space-x-2 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-full px-4 py-2">
                      <User className="w-5 h-5" />
                      <span className="font-semibold">{user?.firstName}</span>
                    </Button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      <Link to="/profile" className="block px-4 py-3 text-sm text-hmh-black-700 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-t-xl">
                        Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-3 text-sm text-hmh-black-700 hover:text-hmh-gold-600 hover:bg-hmh-gold-50">
                          Admin Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-b-xl"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login">
                    <Button variant="ghost" className="text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 font-semibold uppercase tracking-wide text-sm rounded-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 hover:from-hmh-gold-600 hover:to-hmh-gold-700 text-hmh-black-900 font-bold uppercase tracking-wide text-sm px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                      Join Now
                    </Button>
                  </Link>
                </div>
              )}

              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 w-12 h-12 rounded-full transition-all duration-300">
                <Heart className="w-6 h-6" />
              </Button>

              {/* Cart */}
              <Link to="/cart" className="relative group">
                <Button variant="ghost" size="icon" className="text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 w-12 h-12 rounded-full transition-all duration-300">
                  <ShoppingCart className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center p-0 text-xs bg-hmh-gold-500 text-hmh-black-900 border-2 border-white rounded-full font-bold shadow-lg">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 w-12 h-12 rounded-full">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 bg-white animate-slide-down">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6 relative px-4">
              <Input
                type="text"
                placeholder="Search for premium products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 bg-gray-50 border-gray-200 text-hmh-black-900 placeholder-gray-500 focus:border-hmh-gold-500 focus:ring-hmh-gold-500 rounded-full h-12"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-hmh-gold-500 hover:bg-hmh-gold-600 text-hmh-black-900 rounded-full h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
            
            {/* Mobile Categories */}
            <div className="mb-6 px-4">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-hmh-black-900 bg-gray-50 rounded-xl font-semibold focus:outline-none transition-colors hover:bg-hmh-gold-50"
                onClick={() => setCategoryMenuOpen(v => !v)}
                aria-expanded={categoryMenuOpen}
                type="button"
              >
                Categories <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryMenuOpen && (
                <div className="mt-3 max-h-64 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    className="mb-3"
                  />
                  <ul className="space-y-2">
                    {filteredCategories.map((cat: Category) => (
                      <li key={cat._id || cat.id}>
                        <button
                          type="button"
                          className="block w-full text-left px-3 py-2 text-hmh-black-700 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-lg text-sm font-medium truncate transition-colors"
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
            
            {/* Mobile Menu Items */}
            <div className="space-y-2 px-4">
              <Link 
                to="/products" 
                className="block px-4 py-3 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-xl transition-colors font-semibold"
                onClick={closeMobileMenu}
              >
                Products
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/orders" 
                    className="block px-4 py-3 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-xl transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Orders
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-4 py-3 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-xl transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/cart" 
                    className="block px-4 py-3 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-xl transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Cart ({cartItemCount})
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-3 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-xl transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
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
                    className="block px-4 py-3 text-hmh-black-900 hover:text-hmh-gold-600 hover:bg-hmh-gold-50 rounded-xl transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-4 py-3 bg-gradient-to-r from-hmh-gold-500 to-hmh-gold-600 text-hmh-black-900 font-bold rounded-xl text-center"
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
    </header>
  )
}

export default Header
