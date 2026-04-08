import { useState, useEffect } from 'react';
import { Package, DollarSign, Clock, Users, TrendingUp, Bike } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';

export const AdminDashboardPage = () => {
    const [stats, setStats] = useState<any>({
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        activeRiders: 0,
        avgDeliveryTime: '—',
        customerSatisfaction: 0,
        totalRevenue: 0,
        totalDelivered: 0,
    });

    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, reportsData] = await Promise.all([
                    (api as any).getAdminOrders().catch(() => []),
                    api.getReports().catch(() => null)
                ]);

                setOrders(ordersData || []);

                // Calculate revenue from delivered orders
                const deliveredOrders = (ordersData || []).filter((o: any) => o.status === 'delivered');
                const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

                const today = new Date().toISOString().slice(0, 10);
                const todayOrders = (ordersData || []).filter((o: any) => {
                    const created = o.created_at || o.createdAt || '';
                    return created.startsWith(today);
                });
                const todayDelivered = todayOrders.filter((o: any) => o.status === 'delivered');
                const todayRevenue = todayDelivered.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

                setStats({
                    todayOrders: todayOrders.length || reportsData?.stats?.total_orders || 0,
                    todayRevenue: todayRevenue || reportsData?.stats?.total_revenue || 0,
                    pendingOrders: (ordersData || []).filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled').length,
                    activeRiders: reportsData?.stats?.total_riders || 0,
                    avgDeliveryTime: '25 mins',
                    customerSatisfaction: 4.8,
                    totalRevenue, // All-time revenue from delivered orders
                    totalDelivered: deliveredOrders.length,
                });
            } catch (err) {
                console.error('Failed to load admin stats', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);


    return (
        <AdminLayout title="Dashboard Overview">
            <DashboardContent stats={stats} orders={orders} />
        </AdminLayout>
    );
};

// Dashboard Overview Content
const DashboardContent = ({ stats, orders }: { stats: any, orders: any[] }) => (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Today's Orders</p>
                            <p className="text-2xl font-bold">{stats.todayOrders}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Today's Revenue</p>
                            <PriceDisplay price={stats.todayRevenue} className="text-2xl font-bold" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                            <Clock className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Bike className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Active Riders</p>
                            <p className="text-2xl font-bold">{stats.activeRiders}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <PriceDisplay price={stats.totalRevenue} className="text-2xl font-bold text-success" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                            <Users className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Satisfaction</p>
                            <p className="text-2xl font-bold">{stats.customerSatisfaction}/5</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
            <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64 flex items-end gap-2">
                    {orders.length === 0 ? (
                        <div className="p-6 text-muted-foreground">No revenue data available.</div>
                    ) : (
                        (() => {
                            const now = new Date();
                            const last7 = Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date(now);
                                d.setDate(now.getDate() - (6 - i));
                                const key = d.toISOString().slice(0, 10);
                                const revenue = orders.filter((o: any) => {
                                    const created = o.created_at || o.createdAt || '';
                                    return created.startsWith(key);
                                }).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
                                return { day: d.toLocaleDateString(undefined, { weekday: 'short' }), revenue };
                            });
                            return last7.map((day) => (
                                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary"
                                        style={{ height: `${Math.min(200, (day.revenue / Math.max(1, Math.max(...last7.map(d => d.revenue)))) * 200)}px` }}
                                    />
                                    <span className="text-xs text-muted-foreground">{day.day}</span>
                                </div>
                            ));
                        })()
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                        <div key={order.id || order.orderNumber || order._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                                <p className="font-medium">{order.order_number || order.id}</p>
                                <p className="text-sm text-muted-foreground">{order.customer_name || 'Customer'}</p>
                            </div>
                            <div className="text-right">
                                <PriceDisplay price={order.total || 0} className="font-semibold" />
                                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-success/10 text-success' :
                                    order.status === 'on_the_way' ? 'bg-primary/10 text-primary' :
                                        order.status === 'preparing' ? 'bg-warning/10 text-warning' :
                                            'bg-muted text-muted-foreground'
                                    }`}>
                                    {(order.status || '').replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
);

export default AdminDashboardPage;
