import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, User, Clock, Receipt, Bell, CreditCard, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { OrderProgress, OrderStatusBadge } from '@/components/ui/OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/components/ui/PriceDisplay';
import { DeliveryMap } from '@/components/map/DeliveryMap';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch, type Order } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RiderAssignment {
  rider_id: string;
  status: string;
  rider?: {
    name: string;
    phone: string;
  };
}

export const OrderTrackingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [riderAssignment, setRiderAssignment] = useState<RiderAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [manualPhone, setManualPhone] = useState('');

  // Simulated real-time rider location
  const [riderLocation, setRiderLocation] = useState({ lat: -1.2880, lng: 36.8180, label: 'Rider' });

  useEffect(() => {
    if (id && user) {
      fetchOrderDetails();
    }
  }, [id, user]);

  const fetchOrderDetails = async () => {
    try {
      const orderData = await api.getOrder(id!);
      if (!orderData) {
        toast.error('Order not found');
        navigate('/orders');
        return;
      }
      setOrder(orderData);
      setRiderAssignment(null);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;
    setIsPaymentProcessing(true);
    try {
      const stkResponse = await apiFetch<any>('/mpesa/stk', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
          phone: order.phone || manualPhone || user?.phone || '',
          accountRef: `Order#${order.id.slice(0, 8)}`,
          description: 'Order Payment'
        })
      });

      if (stkResponse.success) {
        toast.info('STK Push sent to your phone.');
        pollOrderPaymentStatus(order.id);
      } else {
        setIsPaymentProcessing(false);
        toast.error('Failed to initiate MPesa STK push.');
      }
    } catch (err: any) {
      console.error('STK Error:', err);
      setIsPaymentProcessing(false);
      toast.error(err.message || 'Failed to initiate MPesa payment.');
    }
  };

  const pollOrderPaymentStatus = async (orderId: string) => {
    const maxAttempts = 24;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPaymentProcessing(false);
        toast.error('Payment confirmation timed out.');
        return;
      }

      try {
        const orderData = await api.getOrder(orderId);
        if (orderData.status !== 'created' || orderData.paymentStatus === 'paid') {
          setIsPaymentProcessing(false);
          toast.success('Payment confirmed!');
          setOrder(orderData);
          return;
        }

        attempts++;
        setTimeout(poll, 5000);
      } catch (err) {
        console.error('Polling error:', err);
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  // Simulate rider movement when order is on the way
  useEffect(() => {
    if (order?.status === 'on_the_way') {
      const interval = setInterval(() => {
        setRiderLocation(prev => ({
          ...prev,
          lat: prev.lat - 0.0005,
          lng: prev.lng - 0.0002,
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [order?.status]);

  // Simulate notification when status changes
  useEffect(() => {
    if (order?.status === 'on_the_way' && riderAssignment?.rider) {
      toast.info('🛵 Your order is on the way!', {
        description: `${riderAssignment.rider.name} is heading to your location`,
        duration: 5000,
      });
    }
  }, [order?.status, riderAssignment?.rider]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
        <Header title="Order Details" showBack />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
        <Header title="Order Details" showBack />
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <p className="text-muted-foreground">Order not found</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isActive = ['confirmed', 'preparing', 'on_the_way'].includes(order.status);
  const orderNumber = `ORD-${String(order.id).slice(-6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-background pb-8 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <Header title={`Order ${orderNumber}`} showBack />

      <main className="px-4 py-4 space-y-4">
        {/* Live Map for Active Orders */}
        {order.status === 'on_the_way' && (
          <section className="rounded-xl overflow-hidden shadow-card">
            <DeliveryMap
              riderLocation={riderLocation}
              customerLocation={{
                lat: Number(order.address?.lat) || -1.2750,
                lng: Number(order.address?.lng) || 36.8150,
                label: order.address?.street || 'Delivery Address'
              }}
              showRoute={true}
              className="h-48"
            />
            <div className="p-3 bg-card flex items-center justify-between border-t">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-muted-foreground">Live tracking</span>
              </div>
              <span className="text-sm font-medium">
                ETA: {order.estimatedDelivery ?
                  new Date(order.estimatedDelivery).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'TBD'}
              </span>
            </div>
          </section>
        )}

        {/* Status Card */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Order Status</h3>
            <OrderStatusBadge status={(order.status || 'pending') as any} />
          </div>

          {isActive && (
            <>
              <OrderProgress status={order.status} className="mb-4" />
              {order.estimatedDelivery && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Estimated delivery: {new Date(order.estimatedDelivery).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* Rider Info (if on the way) */}
        {order.status === 'on_the_way' && riderAssignment?.rider && (
          <section className="rounded-xl bg-card p-4 shadow-card">
            <h3 className="font-semibold mb-4">Your Rider</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{riderAssignment.rider.name}</p>
                <p className="text-sm text-muted-foreground">{riderAssignment.rider.phone}</p>
              </div>
              <a
                href={`tel:${riderAssignment.rider.phone}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </section>
        )}

        {/* Delivery Address */}
        {order.address && (
          <section className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Delivery Address</h3>
            </div>
            <p className="text-muted-foreground">
              {order.address.street}
              <br />
              {order.address.city}
            </p>
          </section>
        )}

        {/* Order Items */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Order Items</h3>
          </div>

          <div className="space-y-3 mb-4">
            {(order.items || []).map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.menuItem?.name || 'Item'}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground">Note: {item.notes}</p>
                  )}
                </div>
                <span className="font-medium text-sm">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : 'Free'}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Order Info */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <h3 className="font-semibold mb-3">Order Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <span className={order.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3">
          {order.status === 'created' && (
            <div className="space-y-3">
              {(!order.phone && !user?.phone) && (
                <div className="bg-card rounded-xl p-4 shadow-sm border border-primary/20 bg-primary/5">
                  <Label htmlFor="manual-phone" className="text-sm font-medium mb-2 block">
                    No phone number found. Please enter M-Pesa number:
                  </Label>
                  <Input
                    id="manual-phone"
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Used only for this payment prompt.
                  </p>
                </div>
              )}
              <Button
                onClick={handlePayNow}
                disabled={isPaymentProcessing || (!order.phone && !manualPhone && !user?.phone)}
                className="w-full h-12 bg-success hover:bg-success/90"
              >
                {isPaymentProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay Now with M-Pesa
                  </>
                )}
              </Button>
              {(!order.phone && !manualPhone && !user?.phone) && (
                <p className="text-xs text-center text-destructive">
                  Please enter a phone number to proceed
                </p>
              )}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/help')}
            className="w-full h-12"
          >
            Need Help?
          </Button>
        </div>
      </main>

      {isPaymentProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center max-w-xs px-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse" />
              <Loader2 className="absolute inset-0 h-16 w-16 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-bold">Waiting for Payment</h3>
            <p className="text-muted-foreground">
              Please check your phone for the M-Pesa STK push and enter your PIN to complete the order.
            </p>
            <div className="mt-2 text-sm font-medium text-primary animate-pulse">
              Do not close this page
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
