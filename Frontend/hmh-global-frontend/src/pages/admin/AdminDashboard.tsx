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
  const [progress, setProgress] = useState<any>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  // SSE subscription for scraper progress
  useEffect(() => {
    if (!scraping) return;
    setShowProgress(true);
    setProgress(null);
    setProgressError(null);
    const eventSource = new EventSource(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/scrape-progress`);
    eventSource.addEventListener('start', (e: any) => {
      setProgress({ ...JSON.parse(e.data), current: 0, scraped: 0, errors: 0 });
    });
    eventSource.addEventListener('progress', (e: any) => {
      setProgress(JSON.parse(e.data));
    });
    eventSource.addEventListener('error', (e: any) => {
      setProgressError(JSON.parse(e.data)?.error || 'Scraper error');
    });
    eventSource.addEventListener('finish', (e: any) => {
      setProgress(JSON.parse(e.data));
      setScraping(false);
      setTimeout(() => setShowProgress(false), 3000);
      fetchStats();
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
