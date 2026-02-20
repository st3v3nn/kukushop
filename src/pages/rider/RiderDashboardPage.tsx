import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MapPin,
  Phone,
  CheckCircle,
  LogOut,
  Navigation,
  Star,
  DollarSign,
  Bike,
  Home,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/Logo';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { DeliveryMap } from '@/components/map/DeliveryMap';
import { useNotifications } from '@/contexts/NotificationContext';

import { api, API_BASE_URL } from '@/lib/api';

type DeliveryStatus = 'preparing' | 'ready_for_pickup' | 'accepted' | 'assigned' | 'picked_up' | 'on_the_way' | 'arrived' | 'delivered';

interface ActiveDelivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: {
    street: string;
    city: string;
    landmark?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  };
  items: { name: string; quantity: number }[];
  total: number;
  status: DeliveryStatus;
  distance?: string;
  estimatedTime?: string;
}

export const RiderDashboardPage = () => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ deliveries: 0, earnings: 0, rating: 4.8 });

  const [riderStatus, setRiderStatus] = useState<'online' | 'offline'>('online');
  const [notifications] = useState<{ id: string; type: string; title: string; message: string }[]>([]);
  const addNotification = (n: { type: string; title: string; message: string }) => { console.log('notification:', n); };

  const [riderLocation, setRiderLocation] = useState({ lat: -1.2900, lng: 36.8200, label: 'Your Location' });
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  // Redirect unauthenticated users to rider login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Access check
  if (isAuthenticated && user && user.role !== 'rider') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold mb-2">Access Denied</p>
            <p className="text-muted-foreground mb-4">You need rider privileges to access this page.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const acceptOrder = async (order: any) => {
    try {
      const res = await api.acceptRiderOrder(order.id);
      if (res && res.order) {
        setActiveDelivery(res.order);
        setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
        setActiveTab('active');
        toast.success('Order accepted!');
        addNotification({
          type: 'assigned',
          title: 'Order Accepted',
          message: `You accepted order ${order.orderNumber}. Head to the restaurant for pickup.`,
        });
      }
    } catch (err) {
      console.error('Accept order failed', err);
      toast.error('Failed to accept order');
    }
  };

  const normalizeOrder = (raw: any): ActiveDelivery => {
    return {
      id: raw.id,
      orderNumber: raw.order_number || raw.orderNumber || raw.id.slice(0, 8),
      customerName: raw.customer_name || raw.customerName || 'Customer',
      customerPhone: raw.customer_phone || raw.customerPhone || '',
      address: typeof raw.address === 'string' ? JSON.parse(raw.address) : (raw.address || {}),
      items: typeof raw.items === 'string' ? JSON.parse(raw.items) : (raw.items || []),
      total: Number(raw.total) || 0,
      status: raw.status as DeliveryStatus,
      distance: raw.distance || '2.5 km',
      estimatedTime: raw.estimated_time || raw.estimatedTime || '25 mins'
    };
  };

  const updateDeliveryStatus = async (newStatus: DeliveryStatus) => {
    if (!activeDelivery) return;
    try {
      const res = await api.updateRiderOrderStatus(activeDelivery.id, newStatus);
      if (res && (res.order || res.ok)) {
        if (newStatus === 'delivered') {
          toast.success('Delivery completed! 🎉');
          addNotification({ type: 'delivered', title: 'Delivery Complete!', message: `Order ${activeDelivery.orderNumber} delivered.` });
          setActiveDelivery(null);
          await loadData(); // Refresh history and available orders
          setActiveTab('history'); // Move to history tab to show progress
        } else {
          setActiveDelivery(prev => prev ? { ...prev, status: newStatus } : prev);
          toast.success(`Status updated to: ${newStatus.replace('_', ' ')}`);
          if (newStatus === 'on_the_way') setRiderLocation({ lat: -1.2880, lng: 36.8180, label: 'Your Location' });
          if (newStatus === 'arrived') setRiderLocation({ lat: -1.2750, lng: 36.8150, label: 'Your Location' });
        }
      }
    } catch (err) {
      console.error('Update status failed', err);
      toast.error('Failed to update status');
    }
  };

  // Load data from API
  const loadData = async () => {
    try {
      const [orders, history] = await Promise.all([
        api.getAvailableRiderOrders().catch(() => []),
        api.getRiderHistory().catch(() => []),
      ]);

      const normalizedAvailable = (orders || []).map(normalizeOrder);
      setAvailableOrders(normalizedAvailable);
      setDeliveryHistory(history || []);

      // Calculate basic stats for today
      const today = new Date().toDateString();
      const todayDeliveries = (history || []).filter((d: any) =>
        new Date(d.updated_at || d.deliveredAt).toDateString() === today
      );

      setStats({
        deliveries: todayDeliveries.length,
        earnings: todayDeliveries.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0),
        rating: 5.0, // Default to 5.0 if no rating data
      });

      // Auto-select active delivery if one is assigned to me in an active state
      const activeStatuses = ['accepted', 'assigned', 'picked_up', 'on_the_way', 'arrived'];
      const meActive = (orders || []).find((o: any) =>
        o.assigned_rider_id === user?.id && activeStatuses.includes(o.status)
      );
      if (meActive) {
        setActiveDelivery(normalizeOrder(meActive));
        setActiveTab('active');
      }
    } catch (err) {
      console.error('Failed to load rider data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]); // Reload when user ID is available


  // SSE: listen for real-time rider order updates
  useEffect(() => {
    let es: EventSource | null = null;
    let retryMs = 1000;
    let retryTimer: any = null;

    const connect = () => {
      const token = localStorage.getItem('speedy_bites_auth_token');
      const base = API_BASE_URL.replace(/\/api$/, '');
      const streamUrl = token ? `${base}/api/rider/stream?token=${encodeURIComponent(token)}` : `${base}/api/rider/stream`;
      try {
        es = new EventSource(streamUrl);
        setSseConnected(true);
        retryMs = 1000; // reset backoff on success
      } catch (err) {
        console.warn('SSE connection failed', err);
        setSseConnected(false);
        scheduleReconnect();
        return;
      }

      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (!payload || !payload.type) return;
          const { type, order: rawOrder } = payload;
          if (type === 'order.updated') {
            const order = normalizeOrder(rawOrder);

            // Check if this order is relevant to the rider
            const isAssignedToMe = rawOrder.assigned_rider_id === user?.id;
            const isReady = order.status === 'ready_for_pickup';
            const isPreparing = order.status === 'preparing';

            // Show if it's ready_for_pickup (unassigned) OR assigned to this rider (even if preparing)
            if (isReady || (isAssignedToMe && (isPreparing || isReady || ['assigned', 'accepted', 'picked_up', 'on_the_way', 'arrived'].includes(order.status)))) {
              setAvailableOrders(prev => {
                const exists = prev.find(o => o.id === order.id);
                if (exists) return prev.map(o => o.id === order.id ? order : o);
                return [order, ...prev];
              });
            } else {
              // Remove if not ready AND not assigned to me in an active state
              setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
            }

            // If activeDelivery matches, update it
            if (isAssignedToMe) {
              setActiveDelivery(order);
            }
          }
        } catch (err) {
          console.error('Failed to parse SSE payload', err);
        }
      };

      es.onerror = (err) => {
        console.warn('SSE error', err);
        setSseConnected(false);
        if (es) es.close();
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        retryMs = Math.min(30000, retryMs * 2);
        connect();
      }, retryMs);
    };

    connect();

    return () => {
      if (es) es.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [user?.id]);

  const toggleStatus = () => {
    const newStatus = riderStatus === 'online' ? 'offline' : 'online';
    setRiderStatus(newStatus);
    toast.success(`You are now ${newStatus}`);
  };

  // Tracking: watch rider position and send to backend
  useEffect(() => {
    if (!('geolocation' in navigator) || riderStatus === 'offline' || !activeDelivery) {
      return;
    }

    let lastUpload = 0;
    const UPLOAD_INTERVAL = 10000; // 10 seconds

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude, label: 'Your Location' };
        setRiderLocation(newLoc);

        // Periodically send to backend
        const now = Date.now();
        if (now - lastUpload > UPLOAD_INTERVAL) {
          api.updateRiderLocation(latitude, longitude).catch(err => {
            console.warn('Rider location update failed:', err);
          });
          lastUpload = now;
        }
      },
      (error) => {
        console.error('WatchPosition error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [riderStatus, !!activeDelivery]);

  const statusSteps: DeliveryStatus[] = ['accepted', 'picked_up', 'on_the_way', 'arrived', 'delivered'];
  const currentStepIndex = activeDelivery ? statusSteps.indexOf(activeDelivery.status) : -1;

  const todayStats = stats;


  const customerLocation = activeDelivery
    ? {
      lat: Number(activeDelivery.address.latitude || activeDelivery.address.lat) || -1.2750,
      lng: Number(activeDelivery.address.longitude || activeDelivery.address.lng) || 36.8150,
      label: activeDelivery.address.street
    }
    : undefined;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-2 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <Logo size="sm" className="flex-shrink-0" />
            <div className="min-w-0 pr-2">
              <h1 className="font-bold text-xs sm:text-sm truncate">Rider Dashboard</h1>
              <Badge
                className={cn(
                  "text-[10px] px-1 py-0",
                  riderStatus === 'online' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                )}
              >
                {riderStatus}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
              <Badge className={sseConnected ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                {sseConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            <Button variant="outline" size="sm" onClick={toggleStatus} className="h-8 text-[10px] sm:text-xs">
              {riderStatus === 'online' ? 'Go Offline' : 'Go Online'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile/notifications')} className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} title="Go to Home" className="h-8 w-8">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Today's Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{todayStats.deliveries}</p>
              <p className="text-xs text-muted-foreground">Deliveries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-success" />
              <PriceDisplay price={todayStats.earnings} className="text-xl font-bold" />
              <p className="text-xs text-muted-foreground">Earnings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-warning" />
              <p className="text-xl font-bold">{todayStats.rating}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">
            Available ({availableOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active" disabled={!activeDelivery}>
            Active
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Available Orders */}
        <TabsContent value="available" className="space-y-3 mt-4">
          {riderStatus === 'offline' ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bike className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Go online to see available orders</p>
              </CardContent>
            </Card>
          ) : availableOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No orders available right now</p>
              </CardContent>
            </Card>
          ) : (
            availableOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <PriceDisplay price={order.total} className="font-bold" />
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{order.address.street}</p>
                        <p className="text-muted-foreground">{order.address.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>📍 {order.distance}</span>
                      <span>⏱️ {order.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button className="flex-1 h-10 text-sm" onClick={() => acceptOrder(order)}>
                      Accept Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Active Delivery */}
        <TabsContent value="active" className="mt-4">
          {activeDelivery && (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="h-56">
                  <DeliveryMap
                    riderLocation={riderLocation}
                    customerLocation={customerLocation}
                    className="h-full"
                  />
                </div>
                <div className="p-3 flex justify-between items-center border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">ETA: {activeDelivery?.estimatedTime || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if ('geolocation' in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude, longitude } = position.coords;
                              toast.success(`Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                              // Open in maps with current location
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(activeDelivery.address.street + ', ' + (activeDelivery.address.city || ''))}`,
                                '_blank'
                              );
                            },
                            (error) => {
                              toast.error('Location access denied. Please enable location services.');
                              console.error('Geolocation error:', error);
                            }
                          );
                        } else {
                          toast.error('Geolocation not supported');
                        }
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      My Location
                    </Button>
                    <Button size="sm" variant="secondary" asChild>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={
                          activeDelivery
                            ? (activeDelivery.address.lat && activeDelivery.address.lng
                              ? `https://www.google.com/maps/search/?api=1&query=${activeDelivery.address.lat},${activeDelivery.address.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeDelivery.address.street + ', ' + (activeDelivery.address.city || ''))}`)
                            : 'https://www.google.com/maps'
                        }
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Navigate
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{activeDelivery.orderNumber}</CardTitle>
                    <Badge className="bg-primary/20 text-primary">
                      {activeDelivery.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activeDelivery.customerName}</p>
                      <p className="text-sm text-muted-foreground">{activeDelivery.address.street}</p>
                    </div>
                    <Button variant="outline" size="icon" asChild>
                      <a href={`tel:${activeDelivery.customerPhone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <div className="space-y-1">
                      {activeDelivery.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t">
                      <span className="font-medium">Total</span>
                      <PriceDisplay price={activeDelivery.total} className="font-bold" />
                    </div>
                  </div>

                  <div className="flex justify-between py-3">
                    {statusSteps.map((step, index) => (
                      <div key={step} className="flex flex-col items-center gap-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index <= currentStepIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                          }`}>
                          {index < currentStepIndex ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium mb-2">Update Status:</p>
                    {activeDelivery.status !== 'delivered' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="w-full text-xs sm:text-sm h-auto py-2"
                          variant={activeDelivery.status === 'arrived' ? 'outline' : 'default'}
                          disabled={activeDelivery.status === 'arrived'}
                          onClick={() => updateDeliveryStatus('arrived')}
                        >
                          <MapPin className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="truncate">{activeDelivery.status === 'arrived' ? 'Arrived ✓' : 'Mark Arrived'}</span>
                        </Button>
                        {activeDelivery.status === 'arrived' && (
                          <Button
                            className="bg-accent hover:bg-accent/80 text-accent-foreground text-xs sm:text-sm h-auto py-2"
                            onClick={() => {
                              toast.success('Customer notified of your arrival!');
                            }}
                          >
                            <Phone className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="truncate">Alert Customer</span>
                          </Button>
                        )}
                        <Button
                          className={cn("w-full text-xs sm:text-sm h-auto py-2", activeDelivery.status !== 'arrived' && "col-span-2")}
                          onClick={() => updateDeliveryStatus('delivered')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="truncate">Complete Delivery</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Delivery History */}
        <TabsContent value="history" className="space-y-3 mt-4">
          {deliveryHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No delivery history found</p>
              </CardContent>
            </Card>
          ) : (
            deliveryHistory.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{delivery.orderNumber || delivery.order_number}</h3>
                      <p className="text-sm text-muted-foreground">{delivery.customerName || delivery.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(delivery.updated_at || delivery.deliveredAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <PriceDisplay price={delivery.total} className="font-semibold" />
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="h-4 w-4 text-warning" />
                        <span className="text-sm">{delivery.rating || 5}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default RiderDashboardPage;
