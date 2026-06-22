import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Banknote, Edit2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/components/ui/PriceDisplay';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch, CreateOrderData, getCartItemVariantLabels } from '@/lib/api';
import { playCheckoutCompleteSound } from '@/lib/sound';


type PaymentMethod = 'mpesa' | 'cash';
type StkResponse = {
  success: boolean;
  error?: string;
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, itemCount, clearCart } = useCart();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [address, setAddress] = useState({
    street: '',
    city: 'Nakuru',
    landmark: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const fieldClassName = 'mt-1 h-11 border-border/80 bg-background text-foreground placeholder:text-muted-foreground/80';
  const fieldLabelClassName = 'text-sm font-semibold text-foreground';

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAddress(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          street: prev.street || 'Current Location', // Fallback name
        }));
        setIsLocating(false);
        toast.success('Location updated with precise coordinates!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location. Please enter it manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const pollOrderPaymentStatus = async (orderId: string) => {
    const maxAttempts = 24; // 2 minutes with 5s interval
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsPaymentProcessing(false);
        toast.error('Payment confirmation timed out. Please check your MPesa and order history.');
        return;
      }

      try {
        const order = await api.getOrder(orderId);
        if (order.status === 'pending' || order.paymentStatus === 'paid') {
          setIsPaymentProcessing(false);
          toast.success('Payment confirmed! Order placed.');
          playCheckoutCompleteSound();
          clearCart();
          navigate(`/order-confirmation/${orderId}`);
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

  const handlePlaceOrder = async () => {
    // Validation
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/login');
      return;
    }

    if (!address?.street?.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }

    if (itemCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (paymentMethod === 'mpesa' && !phoneNumber.trim()) {
      toast.error('Please enter a phone number for M-Pesa payment');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare order payload with proper structure
      const orderPayload: CreateOrderData = {
        customer_id: user.id,
        subtotal: cart.subtotal,
        delivery_fee: cart.deliveryFee,
        discount: cart.discount,
        total: cart.total,
        delivery_address: {
          street: address?.street?.trim() || '',
          city: address?.city?.trim() || '',
          landmark: address?.landmark?.trim() || null,
          lat: address?.lat || 0,
          lng: address?.lng || 0,
        },
        notes: notes.trim() || null,
        payment_method: paymentMethod,
        phone: phoneNumber.trim(),
        items: cart.items.map(item => ({
          menu_item_id: item.menuItem.id,
          name: getCartItemVariantLabels(item.options).length > 0
            ? `${item.menuItem.name} (${getCartItemVariantLabels(item.options).join(', ')})`
            : item.menuItem.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          notes: Array.isArray(item.options?.notes) ? item.options?.notes.join(', ') : (item.options?.notes as string) || null,
        })),
        promo_code: cart.promoCode || null,
      };

      // Call API to create order
      const response = await api.createOrder(orderPayload);

      if (response.success && response.orderId) {
        if (paymentMethod === 'mpesa') {
          setIsPaymentProcessing(true);
          try {
            // Initiate STK Push
            const stkResponse = await apiFetch<StkResponse>('/mpesa/stk', {
              method: 'POST',
              body: JSON.stringify({
                orderId: response.orderId,
                amount: cart.total,
                phone: phoneNumber.trim(),
                accountRef: `Order#${response.orderId.slice(0, 8)}`,
                description: 'Order Payment'
              })
            });

            if (stkResponse.success) {
              toast.info('STK Push sent to your phone. Please enter pin to complete.');
              pollOrderPaymentStatus(response.orderId);
            } else {
              setIsPaymentProcessing(false);
              toast.error(stkResponse.error || 'Failed to initiate MPesa STK push. You can try again from order history.');
              navigate(`/order-confirmation/${response.orderId}`);
            }
          } catch (stkErr: unknown) {
            console.error('STK Error:', stkErr);
            setIsPaymentProcessing(false);
            toast.error(stkErr instanceof Error ? stkErr.message : 'We could not start the M-Pesa prompt right now. Please try again shortly.');
            navigate(`/order-confirmation/${response.orderId}`);
          }
        } else {
          toast.success('Order placed successfully!');
          playCheckoutCompleteSound();
          clearCart();
          setTimeout(() => {
            navigate(`/order-confirmation/${response.orderId}`);
          }, 1500);
        }
      } else {
        // Check if it's a location error with more details
        if (response.error && response.allowedCity) {
          toast.error(`${response.error} - ${response.message || `Please select a delivery address in ${response.allowedCity}.`}`);
        } else {
          toast.error(response.error || 'Failed to place order');
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      // Check if error has location information
      if (error instanceof Error && error.message.includes('only')) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to place order');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <Header title="Checkout" showBack showCart={false} />

      <main className="px-4 py-4 space-y-4">
        {/* Delivery Address */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Delivery Address</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="text-xs h-8"
            >
              {isLocating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3 mr-1" />
              )}
              {isLocating ? 'Locating...' : 'Use My Location'}
            </Button>
          </div>


          <div className="space-y-3">
            <div>
              <Label htmlFor="street" className={fieldLabelClassName}>Street Address</Label>
              <Input
                id="street"
                placeholder="Example: Section 58, Nakuru Nyahururu Highway"
                value={address.street}
                onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                className={fieldClassName}
              />
            </div>
            <div>
              <Label htmlFor="city" className={fieldLabelClassName}>City (Nakuru Only)</Label>
              <Input
                id="city"
                value="Nakuru"
                readOnly
                className="mt-1 h-11 cursor-not-allowed bg-muted/70 text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">We currently only deliver within Nakuru.</p>
            </div>
            <div>
              <Label htmlFor="landmark" className={fieldLabelClassName}>Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Example: Vineyard, opposite Rubis petrol station"
                value={address.landmark}
                onChange={(e) => setAddress(prev => ({ ...prev, landmark: e.target.value }))}
                className={fieldClassName}
              />
            </div>
            <div>
              <Label htmlFor="phone" className={fieldLabelClassName}>Phone Number (for MPesa)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Example: 07XXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={fieldClassName}
              />
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <h3 className="font-semibold mb-4">Payment Method</h3>

          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('mpesa')}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-colors',
                paymentMethod === 'mpesa'
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-secondary'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">M-Pesa</p>
                <p className="text-sm text-muted-foreground">Pay with mobile money</p>
              </div>
              <div className={cn(
                'h-5 w-5 rounded-full border-2',
                paymentMethod === 'mpesa'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              )}>
                {paymentMethod === 'mpesa' && (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-colors',
                paymentMethod === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-secondary'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Banknote className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm text-muted-foreground">Pay when you receive</p>
              </div>
              <div className={cn(
                'h-5 w-5 rounded-full border-2',
                paymentMethod === 'cash'
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              )}>
                {paymentMethod === 'cash' && (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Order Notes */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <h3 className="font-semibold mb-3">Delivery Notes (Optional)</h3>
          <Textarea
            placeholder="Any special instructions for delivery..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="border-border/80 bg-background text-foreground placeholder:text-muted-foreground/80"
          />
        </section>

        {/* Order Summary */}
        <section className="rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Order Summary</h3>
            <button
              onClick={() => navigate('/cart')}
              className="text-sm font-medium text-primary flex items-center gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          </div>

          <div className="mb-4 space-y-2">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  {getCartItemVariantLabels(item.options).length > 0 && (
                    <p className="mt-0.5 text-xs font-medium text-foreground">
                      {getCartItemVariantLabels(item.options).join(', ')}
                    </p>
                  )}
                </div>
                <span>{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <CartSummary />
          </div>
        </section>
      </main>

      {/* Place Order Button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6 md:bottom-0 safe-bottom">
        <Button
          onClick={handlePlaceOrder}
          disabled={isLoading || isPaymentProcessing || cart.items.length === 0}
          className="w-full h-14 text-base font-semibold"
          size="lg"
        >
          {isLoading && !isPaymentProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {isPaymentProcessing ? 'Processing Payment...' : isLoading ? 'Placing Order...' : `Place Order • ${formatPrice(cart.total)}`}
        </Button>
      </div>
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

export default CheckoutPage;
