import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import api from '../../lib/api';

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

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
    try {
      await api.post('/api/admin/scrape-northwest');
      toast.success('Scraper started! Products will appear soon.');
    } catch (err: any) {
      toast.error('Failed to start scraper');
    } finally {
      setScraping(false);
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
          </div>
          <p className="text-gray-600">Use the tabs above to manage products and orders.</p>
        </TabsContent>
        <TabsContent value="products">
          {/* TODO: Implement products table with add/edit/delete */}
          <p>Products management coming soon...</p>
        </TabsContent>
        <TabsContent value="orders">
          {/* TODO: Implement orders table with status update */}
          <p>Orders management coming soon...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
