import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
    Bike
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { api } from '@/lib/api';
import {
    ResponsiveContainer,
    ComposedChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Legend,
} from 'recharts';

export const AdminReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [categories, setCategories] = useState<any>([]);
    const [trend, setTrend] = useState<any>([]);
    const [topItems, setTopItems] = useState<any>([]);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await (api as any).getReports?.();
                if (data) {
                    setStats(data.summary || data.stats);
                    setCategories(data.categories || []);
                    setTrend(data.trend || []);
                    setTopItems(data.top_items || []);
                }
            } catch (error) {
                console.error('Failed to load reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Reports & Analytics">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AdminLayout>
        );
    }


    const chartPalette = ['#ea580c', '#f59e0b', '#16a34a', '#0ea5e9', '#7c3aed', '#ef4444'];
    const trendData = trend.map((item: any) => ({
        label: item.label || item.month,
        revenue: Number(item.revenue || 0),
        orders: Number(item.order_count || 0),
    }));
    const categoryRevenueData = categories.map((cat: any) => ({
        name: cat.name,
        revenue: Number(cat.revenue || 0),
        orders: Number(cat.order_count || 0),
    }));
    const maxTopItemRevenue = Math.max(1, ...topItems.map((item: any) => Number(item.revenue || 0)));

    return (
        <AdminLayout title="Reports & Analytics">
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        title="Total Revenue"
                        value={stats?.total_revenue || 0}
                        isPrice
                        icon={DollarSign}
                        color="text-success"
                    />
                    <StatCard
                        title="Total Orders"
                        value={stats?.total_orders || 0}
                        icon={Package}
                        color="text-primary"
                    />
                    <StatCard
                        title="Avg. Order Value"
                        value={stats?.avg_order_value || 0}
                        isPrice
                        icon={TrendingUp}
                        color="text-accent"
                    />
                    <StatCard
                        title="Total Customers"
                        value={stats?.total_customers || 0}
                        icon={Users}
                        color="text-info"
                    />
                    <StatCard
                        title="Active Riders"
                        value={stats?.total_riders || 0}
                        icon={Bike}
                        color="text-warning"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>7-Day Revenue & Orders</CardTitle>
                            <CardDescription>Revenue trend with completed order volume</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="label" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#fb923c" stroke="#ea580c" fillOpacity={0.28} name="Revenue (KES)" />
                                            <Bar yAxisId="right" dataKey="orders" fill="#22c55e" radius={[6, 6, 0, 0]} name="Orders" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No trend data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Category Revenue Split</CardTitle>
                            <CardDescription>Distribution of completed-order revenue across categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {categoryRevenueData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryRevenueData}
                                                dataKey="revenue"
                                                nameKey="name"
                                                innerRadius={60}
                                                outerRadius={95}
                                                paddingAngle={3}
                                            >
                                                {categoryRevenueData.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No category data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Orders vs Revenue</CardTitle>
                            <CardDescription>Compare order count and revenue per category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                {categoryRevenueData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryRevenueData} layout="vertical" margin={{ left: 16, right: 16 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis type="number" />
                                            <YAxis type="category" dataKey="name" width={110} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="orders" fill="#0ea5e9" radius={[0, 6, 6, 0]} name="Orders" />
                                            <Bar dataKey="revenue" fill="#f97316" radius={[0, 6, 6, 0]} name="Revenue (KES)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No category performance data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Selling Items</CardTitle>
                            <CardDescription>Best-performing products by quantity sold</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topItems.length > 0 ? topItems.map((item: any, index: number) => {
                                    const revenue = Number(item.revenue || 0);
                                    const quantity = Number(item.quantity_sold || 0);
                                    const width = `${Math.max(12, Math.round((revenue / maxTopItemRevenue) * 100))}%`;

                                    return (
                                        <div key={`${item.name}-${index}`} className="space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium line-clamp-1">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{quantity} sold</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">KES {revenue.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width }} />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No item sales data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

const StatCard = ({ title, value, isPrice, icon: Icon, color }: any) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 bg-muted rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
                <div className="text-xl font-bold mt-1">
                    {isPrice ? <PriceDisplay price={value} /> : value}
                </div>
            </div>
        </CardContent>
    </Card>
);

export default AdminReportsPage;
