import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import api from '../../lib/api';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, categoryService } from '../../services';
import { Product, Category, ProductFilters, Order } from '../../types';
import { Trash, Edit, Search, Filter, Download } from 'lucide-react';
import { orderService } from '../../services/orders';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // --- Product Management State ---
  const [productFilters, setProductFilters] = useState<ProductFilters>({ sortBy: 'newest', sortOrder: 'desc' });
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // --- Order Management State ---
  const [orderFilters, setOrderFilters] = useState<{ status?: string; search?: string }>({});
  const [orderPage, setOrderPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderFilters, setShowOrderFilters] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderStatusUpdate, setOrderStatusUpdate] = useState<{ [orderId: string]: string }>({});
  // --- Order Details Modal State ---
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  // --- Bulk Actions State ---
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  // SSE subscription for scraper progress
  useEffect(() => {
    if (!scraping) return;
    setShowProgress(true);
    setProgress(null);
    setProgressError(null);
    // Pass JWT token as query parameter for SSE authentication
    const token = localStorage.getItem('token');
    const sseUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/scrape-progress${token ? `?token=${token}` : ''}`;
    const eventSource = new EventSource(sseUrl);
    eventSource.addEventListener('start', (e: any) => {
      setProgress({ ...JSON.parse(e.data), current: 0, scraped: 0, errors: 0 });
    });
    eventSource.addEventListener('progress', (e: any) => {
      if (e.data === 'undefined' || !e.data) return;
      try {
        const data = JSON.parse(e.data);
        setProgress(data);
      } catch (err) {
        console.error('Invalid SSE progress data:', e.data, err);
        // Optionally show error to user or ignore
      }
    });
    eventSource.addEventListener('error', (e: any) => {
      try {
        const errorData = e.data ? JSON.parse(e.data) : null;
        setProgressError(errorData?.error || 'Scraper error');
      } catch (err) {
        setProgressError('Scraper error');
      }
    });
    eventSource.addEventListener('finish', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(data);
        setScraping(false);
        setTimeout(() => setShowProgress(false), 3000);
        fetchStats();
      } catch (err) {
        console.error('Invalid SSE finish data:', e.data, err);
        setScraping(false);
        setShowProgress(false);
      }
    });
    eventSource.onerror = (err) => {
      setProgressError('Connection lost');
      setScraping(false);
      setShowProgress(false);
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  }, [scraping]);

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products', productFilters, productPage],
    queryFn: () => productService.getProducts(productFilters, productPage, 12),
  });
  // Use correct backend response structure
  const products: Product[] = productsData?.data?.data || [];
  const pagination = productsData?.data?.pagination;

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });
  const categories: Category[] = categoriesData?.data || [];

  // Fetch orders (admin)
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', orderFilters, orderPage],
    queryFn: () => orderService.getAllOrders({ ...orderFilters, page: orderPage, limit: 12 }),
  });
  const orders = ordersData?.data?.data || [];
  const orderPagination = ordersData?.data?.pagination;

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderService.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      setUpdatingOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
      setUpdatingOrderId(null);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted');
      setShowDeleteDialog(false);
      setDeleteProductId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    },
  });

  // Filter for imported products (brand: Northwest Cosmetics)
  const importedProducts = products.filter((p: Product) => p.brand === 'Northwest Cosmetics');

  // Handlers
  const handleProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setProductFilters((prev) => ({ ...prev, search: productSearch }));
    setProductPage(1);
  };
  const handleProductFilterChange = (key: keyof ProductFilters, value: any) => {
    setProductFilters((prev) => ({ ...prev, [key]: value }));
    setProductPage(1);
  };
  const handleClearProductFilters = () => {
    setProductFilters({ sortBy: 'newest', sortOrder: 'desc' });
    setProductSearch('');
    setProductPage(1);
  };
  const handleDeleteProduct = (id: string) => {
    setDeleteProductId(id);
    setShowDeleteDialog(true);
  };
  const confirmDeleteProduct = () => {
    if (deleteProductId) deleteProductMutation.mutate(deleteProductId);
  };

  const handleOrderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFilters((prev) => ({ ...prev, search: orderSearch }));
    setOrderPage(1);
  };
  const handleOrderFilterChange = (key: keyof typeof orderFilters, value: any) => {
    setOrderFilters((prev) => ({ ...prev, [key]: value }));
    setOrderPage(1);
  };
  const handleClearOrderFilters = () => {
    setOrderFilters({});
    setOrderSearch('');
    setOrderPage(1);
  };
  const handleOrderStatusChange = (orderId: string, status: string) => {
    setOrderStatusUpdate((prev) => ({ ...prev, [orderId]: status }));
    setUpdatingOrderId(orderId);
    updateOrderStatusMutation.mutate({ id: orderId, status });
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get<{ success: boolean; data: any }>('/api/admin/stats');
      setStats(res.data);
    } catch (err: any) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setShowProgress(true);
    setProgress(null);
    setProgressError(null);
    try {
      await api.post('/api/admin/scrape-northwest');
      toast.success('Scraper started! Products will appear soon.');
    } catch (err: any) {
      toast.error('Failed to start scraper');
      setScraping(false);
      setShowProgress(false);
    }
  };

  // Bulk selection handlers
  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAllOrders = () => {
    if (orders.length === selectedOrderIds.length) setSelectedOrderIds([]);
    else setSelectedOrderIds(orders.map((o: Order) => o.id));
  };
  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrderIds.length === 0) return;
    setBulkLoading(true);
    try {
      if (bulkAction.startsWith('status-')) {
        const status = bulkAction.replace('status-', '');
        await orderService.bulkUpdateOrderStatus(selectedOrderIds, status);
        toast.success(`Updated status for ${selectedOrderIds.length} orders`);
      } else if (bulkAction === 'delete') {
        await orderService.bulkDeleteOrders(selectedOrderIds);
        toast.success(`Deleted ${selectedOrderIds.length} orders`);
      }
      setBulkAction('');
      setSelectedOrderIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };
  const handleExport = async (type: 'csv' | 'excel') => {
    setExportLoading(true);
    try {
      const blob = await orderService.exportOrders({ format: type, status: orderFilters.status, search: orderFilters.search });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders.${type === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported orders as ${type.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">
                {loadingStats ? '...' : stats?.users ?? '-'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Products</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">
                {loadingStats ? '...' : stats?.products ?? '-'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">
                {loadingStats ? '...' : stats?.orders ?? '-'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">
                {loadingStats ? '...' : `$${stats?.revenue?.toLocaleString()}` ?? '-'}
              </CardContent>
            </Card>
          </div>
          <div className="mb-8">
            <Button onClick={handleScrape} disabled={scraping}>
              {scraping ? 'Importing...' : 'Import from Northwest Cosmetics'}
            </Button>
            {showProgress && (
              <div className="mt-6 w-full max-w-xl">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Scraper Progress</span>
                  {progress && (
                    <span className="text-xs text-gray-500">{progress.current || 0} / {progress.total || '?'} processed</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: progress && progress.total ? `${Math.round((progress.current / progress.total) * 100)}%` : '0%' }}
                  ></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-600">
                  <span>Scraped: {progress?.scraped ?? 0}</span>
                  <span>Errors: {progress?.errors ?? 0}</span>
                  {progressError && <span className="text-red-600">{progressError}</span>}
                </div>
                {progress && progress.url && (
                  <div className="mt-1 text-xs text-gray-400 truncate">Current: {progress.url}</div>
                )}
                {progress && progress.current === progress.total && (
                  <div className="mt-2 text-green-600 text-sm font-medium">Scraping complete!</div>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600">Use the tabs above to manage products and orders.</p>
        </TabsContent>
        <TabsContent value="products">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleProductSearch} className="flex gap-2 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-64"
              />
              <Button type="submit" variant="outline"><Search className="w-4 h-4 mr-1" />Search</Button>
            </form>
            <Button variant="outline" onClick={() => setShowProductFilters((v) => !v)}><Filter className="w-4 h-4 mr-1" />Filters</Button>
          </div>
          {showProductFilters && (
            <Card className="mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select value={productFilters.category} onValueChange={(v) => handleProductFilterChange('category', v)}>
                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <Input
                    placeholder="Brand name"
                    value={productFilters.brand || ''}
                    onChange={(e) => handleProductFilterChange('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sort By</label>
                  <Select value={productFilters.sortBy} onValueChange={(v) => handleProductFilterChange('sortBy', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                  <Button variant="outline" onClick={handleClearProductFilters}>Clear Filters</Button>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8">No products found.</td></tr>
                  ) : (
                    products.map((product: Product) => (
                      <tr key={product.id} className="border-b">
                        <td className="px-4 py-2"><img src={product.images[0] ? `http://localhost:5000/uploads/products/${product.images[0]}` : '/api/placeholder/60/60'} alt={product.name} className="w-12 h-12 object-cover rounded" /></td>
                        <td className="px-4 py-2 font-medium">{product.name}</td>
                        <td className="px-4 py-2">{product.category?.name || '-'}</td>
                        <td className="px-4 py-2">{product.brand || '-'}</td>
                        <td className="px-4 py-2">${product.salePrice ? <span className="text-red-600">{product.salePrice}</span> : product.price}</td>
                        <td className="px-4 py-2">{product.stockQuantity}</td>
                        <td className="px-4 py-2">
                          {product.isActive ? <Badge variant="outline" className="text-green-700 border-green-400">Active</Badge> : <Badge variant="outline" className="text-red-700 border-red-400">Inactive</Badge>}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => console.log('Edit product:', product.id)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}><Trash className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button variant="outline" disabled={productPage === 1} onClick={() => setProductPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button key={pageNum} variant={productPage === pageNum ? 'default' : 'outline'} onClick={() => setProductPage(pageNum)} className="w-10 h-10">{pageNum}</Button>
                    );
                  })}
                  <Button variant="outline" disabled={productPage === pagination.pages} onClick={() => setProductPage((p) => Math.min(pagination.pages, p + 1))}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Imported Products Section */}
          <Card className="mt-8">
            <CardHeader><CardTitle>Imported Products (Northwest Cosmetics)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {importedProducts.length === 0 ? (
                <div className="text-gray-500 py-4">No imported products found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedProducts.map((product: Product) => (
                      <tr key={product.id} className="border-b">
                        <td className="px-4 py-2"><img src={product.images[0] ? `http://localhost:5000/uploads/products/${product.images[0]}` : '/api/placeholder/60/60'} alt={product.name} className="w-12 h-12 object-cover rounded" /></td>
                        <td className="px-4 py-2 font-medium">{product.name}</td>
                        <td className="px-4 py-2">{product.category?.name || '-'}</td>
                        <td className="px-4 py-2">${product.salePrice ? <span className="text-red-600">{product.salePrice}</span> : product.price}</td>
                        <td className="px-4 py-2">{product.stockQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
              </DialogHeader>
              <div>Are you sure you want to delete this product? This action cannot be undone.</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDeleteProduct} disabled={deleteProductMutation.isPending}>
                  {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="orders">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleOrderSearch} className="flex gap-2 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search by order number or user email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-64"
              />
              <Button type="submit" variant="outline"><Search className="w-4 h-4 mr-1" />Search</Button>
            </form>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowOrderFilters((v) => !v)}><Filter className="w-4 h-4 mr-1" />Filters</Button>
              <Button variant="outline" onClick={() => handleExport('csv')} disabled={exportLoading}>{exportLoading ? 'Exporting...' : (<><Download className="w-4 h-4 mr-1" />Export CSV</>)}</Button>
              <Button variant="outline" onClick={() => handleExport('excel')} disabled={exportLoading}>{exportLoading ? 'Exporting...' : (<><Download className="w-4 h-4 mr-1" />Export Excel</>)}</Button>
            </div>
          </div>
          {showOrderFilters && (
            <Card className="mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={orderFilters.status} onValueChange={(v) => handleOrderFilterChange('status', v)}>
                    <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                  <Button variant="outline" onClick={handleClearOrderFilters}>Clear Filters</Button>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>All Orders</CardTitle>
              <div className="flex gap-2 items-center">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Bulk Actions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status-processing">Mark as Processing</SelectItem>
                    <SelectItem value="status-shipped">Mark as Shipped</SelectItem>
                    <SelectItem value="status-delivered">Mark as Delivered</SelectItem>
                    <SelectItem value="status-cancelled">Mark as Cancelled</SelectItem>
                    <SelectItem value="delete">Delete Selected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleBulkAction} disabled={!bulkAction || selectedOrderIds.length === 0 || bulkLoading}>{bulkLoading ? 'Applying...' : 'Apply'}</Button>
                <span className="text-xs text-gray-500">{selectedOrderIds.length} selected</span>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2"><input type="checkbox" checked={orders.length > 0 && selectedOrderIds.length === orders.length} onChange={selectAllOrders} /></th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8">No orders found.</td></tr>
                  ) : (
                    orders.map((order: Order) => (
                      <tr key={order.id} className="border-b">
                        <td className="px-2 py-2"><input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} /></td>
                        <td className="px-4 py-2 font-mono">{order.orderNumber}</td>
                        <td className="px-4 py-2">{order.user?.email || order.userId || '-'}</td>
                        <td className="px-4 py-2">
                          <Select
                            value={orderStatusUpdate[order.id] || order.status}
                            onValueChange={(v) => handleOrderStatusChange(order.id, v)}
                            disabled={updatingOrderId === order.id || updateOrderStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2">${order.total?.toFixed(2) ?? '-'}</td>
                        <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}>View</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Pagination */}
              {orderPagination && orderPagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button variant="outline" disabled={orderPage === 1} onClick={() => setOrderPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  {Array.from({ length: Math.min(5, orderPagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button key={pageNum} variant={orderPage === pageNum ? 'default' : 'outline'} onClick={() => setOrderPage(pageNum)} className="w-10 h-10">{pageNum}</Button>
                    );
                  })}
                  <Button variant="outline" disabled={orderPage === orderPagination.pages} onClick={() => setOrderPage((p) => Math.min(orderPagination.pages, p + 1))}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Order Details Modal */}
          <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>
              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-mono text-lg font-bold">Order #{selectedOrder.orderNumber}</div>
                      <div className="text-xs text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline" className="capitalize">{selectedOrder.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold mb-1">Shipping Address</div>
                      <div className="text-sm text-gray-700">
                        {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}<br />
                        {selectedOrder.shippingAddress.street}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                        {selectedOrder.shippingAddress.country}
                        {selectedOrder.shippingAddress.phone && (<><br />{selectedOrder.shippingAddress.phone}</>)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Billing Address</div>
                      <div className="text-sm text-gray-700">
                        {selectedOrder.billingAddress.firstName} {selectedOrder.billingAddress.lastName}<br />
                        {selectedOrder.billingAddress.street}<br />
                        {selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.state} {selectedOrder.billingAddress.zipCode}<br />
                        {selectedOrder.billingAddress.country}
                        {selectedOrder.billingAddress.phone && (<><br />{selectedOrder.billingAddress.phone}</>)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Order Items</div>
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left">Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item: any) => (
                          <tr key={item.id}>
                            <td>{item.product?.name || item.name}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td>${item.price?.toFixed(2)}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold mb-1">Payment Method</div>
                      <div className="text-sm text-gray-700 capitalize">{selectedOrder.paymentMethod.replace(/[-_]/g, ' ')}</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Order Summary</div>
                      <div className="text-sm text-gray-700">
                        Subtotal: ${selectedOrder.subtotal?.toFixed(2) ?? selectedOrder.pricing?.subtotal?.toFixed(2)}<br />
                        Tax: ${selectedOrder.tax?.toFixed(2) ?? selectedOrder.pricing?.tax?.toFixed(2) ?? '0.00'}<br />
                        Shipping: ${selectedOrder.shipping?.toFixed(2) ?? selectedOrder.pricing?.shipping?.toFixed(2) ?? '0.00'}<br />
                        <span className="font-bold">Total: ${selectedOrder.total?.toFixed(2) ?? selectedOrder.pricing?.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>Loading...</div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
