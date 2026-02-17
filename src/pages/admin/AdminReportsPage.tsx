import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    Package,
    DollarSign,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Bike
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { api } from '@/lib/api';

export const AdminReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [categories, setCategories] = useState<any>([]);
    const [trend, setTrend] = useState<any>([]);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await (api as any).getReports?.();
                if (data) {
                    setStats(data.summary || data.stats);
                    setCategories(data.categories || []);
                    setTrend(data.trend || []);
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
                    {/* Sales Trend Chart (Simplified) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Trend</CardTitle>
                            <CardDescription>Recent monthly revenue overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-end gap-2 pb-2">
                                {trend && trend.length > 0 ? trend.map((item: any, i: number) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative group"
                                            style={{ height: `${Math.min(100, (item.revenue / Math.max(1, ...trend.map((t: any) => t.revenue))) * 100)}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                KES {item.revenue.toLocaleString()}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground uppercase">
                                            {item.month}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No trend data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Performance</CardTitle>
                            <CardDescription>Revenue distribution by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {categories && categories.length > 0 ? categories.map((cat: any) => {
                                    const totalRev = categories.reduce((sum: number, c: any) => sum + c.revenue, 0);
                                    const percentage = totalRev > 0 ? Math.round((cat.revenue / totalRev) * 100) : 0;

                                    return (
                                        <div key={cat.name} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{cat.name}</span>
                                                <span className="text-muted-foreground">{percentage}% (KES {cat.revenue.toLocaleString()})</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No category data available
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
