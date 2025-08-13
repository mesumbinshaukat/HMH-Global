import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { productService } from '../../services/products'
import { API_BASE_URL } from '../../lib/api'
import { Search, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Suggestion = {
  id: string
  name: string
  brand?: string
  slug?: string
  image?: string | null
  price?: number
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<Suggestion[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const navigate = useNavigate()

  // Debounced fetch suggestions
  React.useEffect(() => {
    if (!open) return

    setError(null)
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await productService.suggestProducts(q)
        // ApiResponse<{ data: Suggestion[] }> or directly Suggestion[] depending on wrapper
        const data = (res as any)?.data ?? (res as any)
        setResults(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch suggestions')
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(t)
  }, [query, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    onOpenChange(false)
    navigate(`/products?search=${encodeURIComponent(q)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border border-baby-pink-100">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-commando-green-900">Search products</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="relative mb-4">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for premium products..."
              className="h-12 pr-12 rounded-2xl border-commando-green-200 focus:border-baby-pink-500 focus:ring-baby-pink-200 text-commando-green-900 placeholder-commando-green-500"
            />
            <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-baby-pink-500 hover:bg-baby-pink-600 text-white transition-all duration-300">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {loading && (
            <div className="flex items-center justify-center py-8 text-baby-pink-700">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Fetching suggestions...
            </div>
          )}

          {!loading && error && (
            <div className="text-sm text-red-600 py-4">{error}</div>
          )}

          {!loading && !error && results.length > 0 && (
            <ul className="divide-y divide-baby-pink-100">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => {
                      onOpenChange(false)
                      navigate(`/products/${r.id}`)
                    }}
                    className="w-full p-4 text-left hover:bg-baby-pink-50 transition-colors duration-200 rounded-xl group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-baby-pink-100 to-baby-pink-200 flex items-center justify-center">
                        {r.image ? (
                          <img
                            src={`${API_BASE_URL}/uploads/${r.image}`}
                            alt={r.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-baby-pink-600 text-center">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-commando-green-900 group-hover:text-commando-green-700 transition-colors duration-200 truncate">
                          {r.name}
                        </h4>
                        {r.brand && (
                          <p className="text-sm text-commando-green-600 truncate">{r.brand}</p>
                        )}
                        {r.price && (
                          <p className="text-lg font-bold text-baby-pink-600">£{r.price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="text-center py-8 text-commando-green-600">
              <p>No products found for "{query}"</p>
              <p className="text-sm text-commando-green-500 mt-1">Try different keywords or browse our categories</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SearchModal
