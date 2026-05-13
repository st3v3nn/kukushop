import { useState, useEffect } from 'react';
import { Package, Bike, Clock, MapPin, Phone, User, Loader2, CreditCard, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export const AdminOrdersSection = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const fetchOrdersAndRiders = async () => {
        try {
            const [ordersData, ridersData] = await Promise.all([
                (api as any).getAdminOrders().catch(() => []),
                api.getRiders().catch(() => [])
            ]);
            setOrders(ordersData || []);
            setRiders(ridersData || []);
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdersAndRiders();
        const interval = setInterval(fetchOrdersAndRiders, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            await api.updateOrderStatusAdmin(orderId, status);
            toast.success(`Order status updated to ${status}`);
            fetchOrdersAndRiders();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleAssignRider = async (orderId: string, riderId: string) => {
        setIsAssigning(true);
        try {
            await api.assignRiderToOrder(orderId, riderId);
            toast.success('Rider assigned successfully');
            setSelectedOrder(null);
            fetchOrdersAndRiders();
        } catch (err) {
            toast.error('Failed to assign rider');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleClearAllOrders = async () => {
        if (!window.confirm('⚠️ Are you sure? This will permanently delete ALL orders and cannot be undone.')) {
            return;
        }

        setIsClearing(true);
        try {
            await api.clearAllOrdersAdmin();
            toast.success('All orders cleared successfully');
            setOrders([]);
        } catch (err) {
            console.error('Failed to clear orders', err);
            toast.error('Failed to clear orders');
        } finally {
            setIsClearing(false);
        }
    };

    const handleExportTransactions = async () => {
        setIsExporting(true);
        try {
            const blob = await api.exportTransactions();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Transactions exported successfully');
        } catch (err) {
            console.error('Failed to export transactions', err);
            toast.error('Failed to export transactions');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-100';
            case 'preparing': return 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100';
            case 'on_the_way': return 'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100';
            case 'arrived': return 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100';
            case 'delivered': return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100';
            case 'cancelled': return 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100';
            case 'created': return 'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-100';
            default: return 'border-border bg-background text-foreground';
        }
    };

    const getStatusLabel = (status: string) =>
        status === 'created' ? 'Pending Payment' : status.replace(/_/g, ' ');

    if (isLoading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold">Manage Orders</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updates every 10s</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportTransactions}
                        disabled={isExporting}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAllOrders}
                        disabled={isClearing || orders.length === 0}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear All Orders
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8 mb-2 opacity-20" />
                            <p>No orders found</p>
                        </CardContent>
                    </Card>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                            <div className="border-l-4 border-primary p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-lg">#{order.order_number || order.id.slice(0, 8)}</span>
                                            <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide', getStatusColor(order.status))}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {order.customer_name || 'Guest User'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {order.created_at || order.createdAt ? new Date(order.created_at || order.createdAt).toLocaleTimeString() : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Dialog open={selectedOrder?.id === order.id} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Bike className="h-4 w-4" />
                                                    {order.rider_name ? `Assigned: ${order.rider_name} (${order.rider_phone || 'N/A'})` : 'Assign Rider'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Assign Rider to #{order.order_number || order.id.slice(0, 8)}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Select a Rider</label>
                                                        <Select onValueChange={(val) => handleAssignRider(order.id, val)} disabled={isAssigning}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select available rider..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {riders.map(rider => (
                                                                    <SelectItem key={rider.id} value={rider.id}>
                                                                        <div className="flex flex-col">
                                                                            <span>{rider.name}</span>
                                                                            <span className="text-xs text-muted-foreground">{rider.phone || 'No phone'}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {isAssigning && (
                                                        <div className="flex items-center justify-center py-2">
                                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <Select
                                            value={order.status}
                                            onValueChange={(val) => handleUpdateStatus(order.id, val)}
                                        >
                                            <SelectTrigger className={cn('h-10 w-[160px] border-2 font-semibold capitalize', getStatusColor(order.status))}>
                                                <SelectValue>{getStatusLabel(order.status)}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="created">Pending Payment</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="preparing">Preparing</SelectItem>
                                                <SelectItem value="on_the_way">On Way</SelectItem>
                                                <SelectItem value="arrived">Arrived</SelectItem>
                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="pl-4 border-l">
                                            <PriceDisplay price={order.total} className="font-bold text-lg" />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <p className="flex items-start gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span>{order.address || 'No address provided'}</span>
                                        </p>
                                        {(order.customer_phone || order.phone) && (
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                {order.customer_phone || order.phone}
                                            </p>
                                        )}
                                        {order.payment_method && (
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <CreditCard className="h-4 w-4" />
                                                <span className="capitalize">{order.payment_method.replace('_', ' ')}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-muted/50 p-3 rounded-lg">
                                        <p className="font-semibold mb-1 flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Order Items
                                        </p>
                                        <div className="space-y-1">
                                            {order.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <PriceDisplay price={item.total_price} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
