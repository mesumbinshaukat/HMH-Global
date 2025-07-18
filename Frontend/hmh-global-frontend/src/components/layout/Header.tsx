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
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">HMH Global</div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
              >
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {/* Categories Mega Menu */}
            <div className="relative" onMouseEnter={() => setCategoryMenuOpen(true)} onMouseLeave={() => setCategoryMenuOpen(false)}>
              <button
                className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium px-3 py-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={categoryMenuOpen}
                type="button"
              >
                Categories <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {categoryMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-[800px] bg-white shadow-xl rounded-lg border z-50 p-6 animate-fade-in"
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
                      className="w-64 mr-4"
                    />
                    <span className="text-xs text-gray-500">{filteredCategories.length} categories</span>
                  </div>
                  <div className="grid grid-cols-4 gap-6 max-h-[400px] overflow-y-auto">
                    {chunkedCategories.map((col, colIdx) => (
                      <ul key={colIdx} className="space-y-2">
                        {col.map((cat: Category) => (
                          <li key={cat._id || cat.id}>
                            <Link
                              to={`/products?category=${cat._id || cat.id}`}
                              className="block text-gray-700 hover:text-primary text-sm font-medium truncate"
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
            <Link to="/products" className="text-gray-700 hover:text-primary transition-colors">
              Products
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-gray-700 hover:text-primary transition-colors">
                  Orders
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-primary transition-colors">
                  Profile
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4 relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
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
                <div className="mt-2 max-h-64 overflow-y-auto bg-white rounded shadow border p-2">
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
                        <Link
                          to={`/products?category=${cat._id || cat.id}`}
                          className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium truncate"
                          onClick={() => {
                            setCategoryMenuOpen(false)
                            closeMobileMenu()
                          }}
                        >
                          {cat.name}
                        </Link>
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
                onClick={closeMobileMenu}
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
