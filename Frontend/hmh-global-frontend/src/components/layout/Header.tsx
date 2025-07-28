import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Menu, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useAuthStore, useUIStore } from '../../store'
import { useCart } from '../../hooks/useQuery'
import { Badge } from '../ui/badge'
import { useCategories } from '../../hooks/useQuery'
import { ChevronDown } from 'lucide-react'
import { Category } from '../../types'
import logo from '../../logo.jpeg'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore()
  const { data: cartData } = useCart()
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: categoriesData } = useCategories()
  // categoriesData is ApiResponse<Category[]>
  const categories = categoriesData?.data || []
  const [categoryMenuOpen, setCategoryMenuOpen] = React.useState(false)
  const [categorySearch, setCategorySearch] = React.useState('')

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
    <header className="bg-black shadow-lg border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative overflow-hidden rounded-lg">
              <img src={logo} alt="HMH Global" className="h-12 w-12 object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight hover:text-red-500 transition-colors duration-300">
              HMH Global
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 rounded-full h-12"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 relative">
            {/* Categories Mega Menu */}
            <div className="relative" onMouseEnter={() => setCategoryMenuOpen(true)} onMouseLeave={() => setCategoryMenuOpen(false)}>
              <button
                className="flex items-center text-white hover:text-red-500 transition-colors font-bold px-4 py-3 focus:outline-none uppercase tracking-wide text-sm"
                aria-haspopup="true"
                aria-expanded={categoryMenuOpen}
                type="button"
              >
                Categories <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {categoryMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-[800px] bg-gray-900 shadow-2xl rounded-lg border border-gray-700 z-50 p-6 animate-fade-in backdrop-blur-md"
                  tabIndex={-1}
                  onBlur={() => setCategoryMenuOpen(false)}
                  aria-label="All categories mega menu"
                  role="menu"
                >
                  <div className="mb-4 flex items-center">
                    <Input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className="w-64 mr-4 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 rounded-lg"
                    />
                    <span className="text-xs text-gray-400">{filteredCategories.length} categories</span>
                  </div>
                  <div className="grid grid-cols-4 gap-6 max-h-[400px] overflow-y-auto">
                    {chunkedCategories.map((col, colIdx) => (
                      <ul key={colIdx} className="space-y-2">
                        {col.map((cat: Category) => (
                          <li key={cat._id || cat.id}>
                            <Link
                              to={`/products?category=${cat._id || cat.id}`}
                              className="block text-gray-300 hover:text-red-500 text-sm font-semibold truncate transition-colors duration-200 py-1"
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
            <Link to="/products" className="text-white hover:text-red-500 transition-colors font-bold uppercase tracking-wide text-sm px-4 py-3" onClick={(e) => {
              e.preventDefault();
              navigate('/products');
            }}>
              Products
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-white hover:text-red-500 transition-colors font-bold uppercase tracking-wide text-sm px-4 py-3">
                  Orders
                </Link>
                <Link to="/profile" className="text-white hover:text-red-500 transition-colors font-bold uppercase tracking-wide text-sm px-4 py-3">
                  Profile
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-white hover:text-red-500 transition-colors font-bold uppercase tracking-wide text-sm px-4 py-3">
                    Admin
                  </Link>
                )}
                <Button variant="ghost" onClick={handleLogout} className="text-white hover:text-red-500 hover:bg-gray-800 font-bold uppercase tracking-wide text-sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-white hover:text-red-500 hover:bg-gray-800 font-bold uppercase tracking-wide text-sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wide text-sm px-6 py-3 rounded-full">Register</Button>
                </Link>
              </>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative group">
              <Button variant="ghost" size="icon" className="text-white hover:text-red-500 hover:bg-gray-800 w-12 h-12 rounded-full">
                <ShoppingCart className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center p-0 text-xs bg-red-600 text-white border-2 border-black rounded-full font-bold">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-white hover:text-red-500 hover:bg-gray-800 w-12 h-12">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700 bg-black">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4 relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 rounded-full h-12"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
            {/* Mobile Categories Accordion */}
            <div className="mb-4">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 bg-gray-100 rounded-md font-medium focus:outline-none"
                onClick={() => setCategoryMenuOpen(v => !v)}
                aria-expanded={categoryMenuOpen}
                type="button"
              >
                Categories <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryMenuOpen && (
  <div className="mt-2 max-h-64 overflow-y-auto bg-white rounded shadow border p-2 z-50 absolute right-0 max-w-screen-sm w-[90vw] sm:w-[500px] md:w-[600px] overflow-x-auto">
    <Input
      type="text"
      placeholder="Search categories..."
      value={categorySearch}
      onChange={e => setCategorySearch(e.target.value)}
      className="mb-2"
    />
    <ul className="space-y-1">
      {filteredCategories.map((cat: Category) => (
        <li key={cat._id || cat.id}>
          <button
            type="button"
            className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium truncate"
            onClick={() => {
              setCategoryMenuOpen(false);
              closeMobileMenu();
              const url = `/products?category=${cat._id || cat.id}`;
              if (window.location.pathname + window.location.search === url) {
                // If already on the same category, force a reload
                window.location.href = url;
              } else {
                navigate(url);
              }
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
            <div className="space-y-2">
              <Link 
                to="/products" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={(e) => {
                  e.preventDefault();
                  closeMobileMenu();
                  navigate('/products');
                }}
              >
                Products
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/orders" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Orders
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/cart" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Cart ({cartItemCount})
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      Admin
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-3 py-2"
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
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Register
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
