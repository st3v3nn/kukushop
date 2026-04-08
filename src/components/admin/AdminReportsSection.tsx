import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from 'recharts';

export const AdminReportsSection = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getReports();
        if (data) {
          // Expand orders from stats/categories/trend
          setOrders([]);
          setReports(data);
        }
      } catch (err) {
        console.error('Failed to fetch admin reports', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [reports, setReports] = useState<any | null>(null);

  const totalRevenue = reports?.stats?.total_revenue || 0;
  const totalOrders = reports?.stats?.total_orders || 0;
  const avgOrderValue = reports?.stats?.avg_order_value || 0;
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
              ) : !reports ? (
                <div className="p-6 text-muted-foreground">No revenue data available.</div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={reports.trend.map((t: any) => ({ name: t.month, revenue: Number(t.revenue) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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
          ) : !reports ? (
            <div className="p-6 text-muted-foreground">No order data available.</div>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={reports.categories.map((c: any) => ({ name: c.name, revenue: Number(c.revenue) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
