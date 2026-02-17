import { Trash2 } from 'lucide-react';
import { getImageURL } from '@/lib/api';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { formatPrice } from '@/components/ui/PriceDisplay';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/lib/api';

interface CartItemProps {
  item: CartItemType;
  className?: string;
}

export const CartItemCard = ({ item, className }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className={cn(
      'flex gap-3 rounded-xl bg-card p-3 shadow-card',
      className
    )}>
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
        <img 
          src={getImageURL(item.menuItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80')} 
          alt={item.menuItem.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{item.menuItem.name}</h3>
            {item.options && Object.keys(item.options).length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {Object.values(item.options).flat().join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-sm">{formatPrice(item.totalPrice)}</span>
          <QuantitySelector
            quantity={item.quantity}
            onChange={(qty) => updateQuantity(item.id, qty)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
