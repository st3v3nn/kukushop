import { useState, useEffect } from 'react';
import { Package, Bike, Check, X, Clock, MapPin, Phone, User, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const AdminOrdersSection = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isAssigning, setIsAssigning] = useState(false);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-600';
            case 'preparing': return 'bg-blue-500/10 text-blue-600';
            case 'on_the_way': return 'bg-purple-500/10 text-purple-600';
            case 'arrived': return 'bg-indigo-500/10 text-indigo-600';
            case 'delivered': return 'bg-green-500/10 text-green-600';
            case 'cancelled': return 'bg-red-500/10 text-red-600';
            default: return 'bg-gray-500/10 text-gray-600';
        }
    };

    if (isLoading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Manage Orders</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Updates every 10s</span>
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
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {order.customer_name || 'Guest User'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(order.created_at || order.createdAt).toLocaleTimeString()}
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
                                                    {order.rider_name ? `Assigned: ${order.rider_name}` : 'Assign Rider'}
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
                                            <SelectTrigger className="w-[140px] h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
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
