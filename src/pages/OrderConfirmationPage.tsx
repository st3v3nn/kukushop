import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Logo } from '@/components/ui/Logo';

export const OrderConfirmationPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Auto redirect after 10 seconds if user doesn't click anything
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/orders');
        }, 12000); // Give a bit more time
        return () => clearTimeout(timer);
    }, [navigate]);


    return (
        <div className="min-h-screen bg-background pb-32 lg:min-h-0 lg:bg-transparent lg:pb-0">
            <Header title="Order Confirmed" showBack={false} showCart={false} />

            <main className="px-4 flex flex-col items-center justify-center pt-12 space-y-8 max-w-md mx-auto">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center animate-bounce">
                        <CheckCircle className="h-12 w-12 text-success" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center animate-ping opacity-20"></div>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Thank You!</h2>
                    <p className="text-muted-foreground">
                        Your order has been received and is being processed.
                    </p>
                    {id && (
                        <div className="inline-block mt-4 px-4 py-2 bg-muted rounded-full text-sm font-mono">
                            Order ID: {id.slice(-8).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="w-full space-y-4 pt-8">
                    <Card className="p-4 bg-muted/30 border-dashed">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <div className="text-left text-sm">
                                <p className="font-semibold">Next Steps</p>
                                <p className="text-muted-foreground">You can track your order status in real-time on our tracking page.</p>
                            </div>
                        </div>
                    </Card>

                    <Button
                        onClick={() => navigate(`/orders/${id}`)}
                        className="w-full h-14 text-base font-semibold group"
                        size="lg"
                        disabled={!id}
                    >
                        Track My Order
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>


                    <Button
                        onClick={() => navigate('/')}
                        variant="ghost"
                        className="w-full h-12 text-muted-foreground"
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </div>
            </main>

            {/* Brand Logo at the bottom */}
            <div className="fixed bottom-32 left-0 right-0 flex justify-center opacity-20 pointer-events-none lg:static lg:mt-12">
                <Logo size="lg" />
            </div>
        </div>
    );
};

// Simple internal Card component since we don't want to import too many things if not needed, 
// but we should check if @/components/ui/card exists.
import { Card } from '@/components/ui/card';

export default OrderConfirmationPage;
