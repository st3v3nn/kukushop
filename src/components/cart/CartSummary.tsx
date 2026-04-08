import { formatPrice } from '@/components/ui/PriceDisplay';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartSummaryProps {
  className?: string;
}

export const CartSummary = ({ className }: CartSummaryProps) => {
  const { cart } = useCart();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatPrice(cart.subtotal)}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Delivery Fee</span>
        <span>{cart.deliveryFee > 0 ? formatPrice(cart.deliveryFee) : 'Free'}</span>
      </div>
      
      {cart.discount > 0 && (
        <div className="flex justify-between text-sm text-success">
          <span>Discount</span>
          <span>-{formatPrice(cart.discount)}</span>
        </div>
      )}
      
      <div className="border-t pt-3">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-lg">{formatPrice(cart.total)}</span>
        </div>
      </div>
    </div>
  );
};
