import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export const AdminReportsSection = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getOrders().catch(() => []);
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to fetch orders for reports', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const customerSatisfaction = 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Weekly Revenue</p>
            <PriceDisplay price={totalRevenue} className="text-xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
            <PriceDisplay price={avgOrderValue} className="text-xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Customer Rating</p>
            <p className="text-xl font-bold">⭐ {customerSatisfaction}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Day</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-muted-foreground">No revenue data available.</div>
          ) : (
            <div className="p-4">{/* Chart rendering could be added here */}</div>
          )}
        </CardContent>
      </Card>

      {/* Orders Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Day</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-muted-foreground">No order data available.</div>
          ) : (
            <div className="p-4">{/* Chart rendering could be added here */}</div>
          )}
        </CardContent>
      </Card>

      {/* Top Items Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-6 text-muted-foreground">Top items will appear here when there is real data.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
