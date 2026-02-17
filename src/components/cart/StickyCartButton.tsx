import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/components/ui/PriceDisplay';
import { cn } from '@/lib/utils';

interface StickyCartButtonProps {
  className?: string;
}

export const StickyCartButton = ({ className }: StickyCartButtonProps) => {
  const { cart, itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className={cn(
      'fixed bottom-20 left-4 right-4 z-40 xl:bottom-4 xl:left-auto xl:right-4 xl:max-w-sm lg:hidden animate-slide-up',
      className
    )}>
      <Link
        to="/cart"
        className="flex items-center justify-between gap-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sticky"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
              {itemCount}
            </span>
          </div>
          <span className="font-medium">View Cart</span>
        </div>
        <span className="font-bold">{formatPrice(cart.total)}</span>
      </Link>
    </div>
  );
};
