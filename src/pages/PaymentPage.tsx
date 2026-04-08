import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { PriceDisplay } from '@/components/ui/PriceDisplay';

type PaymentStatus = 'input' | 'processing' | 'waiting' | 'success' | 'failed';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderTotal = location.state?.total || 2050;
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('input');
  const [countdown, setCountdown] = useState(60);

  // Simulate payment flow
  const handlePayment = () => {
    if (!phoneNumber || phoneNumber.length < 9) return;
    
    setStatus('processing');
    
    // Simulate STK push
    setTimeout(() => {
      setStatus('waiting');
    }, 2000);
  };

  // Countdown for waiting state
  useEffect(() => {
    if (status === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && status === 'waiting') {
      // Simulate random success/failure for demo
      setStatus(Math.random() > 0.3 ? 'success' : 'failed');
    }
  }, [status, countdown]);

  // Simulate checking payment
  const simulateSuccess = () => setStatus('success');
  const simulateFailure = () => setStatus('failed');

  return (
    <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b lg:hidden">
        <div className="flex items-center px-4 py-3">
          {status === 'input' && (
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="ml-3 text-lg font-semibold">M-Pesa Payment</h1>
        </div>
      </header>

      <div className="container max-w-md mx-auto p-4 space-y-6">
        {/* Order Summary Card */}
        <Card className="p-4 bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Order Total</span>
            <PriceDisplay price={orderTotal} className="text-xl font-bold" />
          </div>
        </Card>

        {/* Status-based content */}
        {status === 'input' && (
          <div className="space-y-6">
            {/* M-Pesa Logo/Branding */}
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-green-800">M-Pesa</span>
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">M-Pesa Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-10 text-lg h-14"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the phone number registered with M-Pesa
              </p>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={phoneNumber.length < 9}
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            >
              Pay with M-Pesa
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              You will receive an M-Pesa prompt on your phone
            </p>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold">Initiating Payment</h2>
            <p className="text-muted-foreground">
              Sending STK push to {phoneNumber}...
            </p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="py-8 text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full border-4 border-green-200 flex items-center justify-center">
                <Phone className="h-10 w-10 text-green-600 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border">
                <span className="text-sm font-mono">{countdown}s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Check Your Phone</h2>
              <p className="text-muted-foreground">
                Enter your M-Pesa PIN to complete payment
              </p>
            </div>

            {/* Demo controls */}
            <div className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Demo: Simulate result</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={simulateSuccess} className="text-green-600">
                  Simulate Success
                </Button>
                <Button size="sm" variant="outline" onClick={simulateFailure} className="text-destructive">
                  Simulate Failure
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-12 text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
              <p className="text-muted-foreground">
                Your order has been placed
              </p>
            </div>

            <Card className="p-4 text-left bg-green-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono">QKL7H8X9ZP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <PriceDisplay price={orderTotal} className="font-semibold" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{phoneNumber}</span>
                </div>
              </div>
            </Card>

            <Button 
              onClick={() => navigate('/orders')}
              className="w-full h-14 text-lg"
            >
              Track My Order
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-12 text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-12 w-12 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">Payment Failed</h2>
              <p className="text-muted-foreground">
                Transaction could not be completed
              </p>
            </div>

            <Card className="p-4 text-left bg-red-50">
              <p className="text-sm text-destructive">
                The payment was not completed. This could be due to insufficient funds, wrong PIN, or the request timed out.
              </p>
            </Card>

            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setStatus('input');
                  setCountdown(60);
                }}
                className="w-full h-14 text-lg"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/checkout')}
                className="w-full"
              >
                Change Payment Method
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
