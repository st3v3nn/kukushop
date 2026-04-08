import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Format price in Kenyan Shillings
export const formatPrice = (price: number): string => {
  return `KES ${price.toLocaleString()}`;
};

export const PriceDisplay = ({
  price,
  originalPrice,
  size = 'md',
  className
}: PriceDisplayProps) => {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn(
        'font-bold text-foreground',
        sizeClasses[size]
      )}>
        {formatPrice(price)}
      </span>
      
      {hasDiscount && (
        <>
          <span className={cn(
            'text-muted-foreground line-through',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {formatPrice(originalPrice)}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {discountPercent}% OFF
          </span>
        </>
      )}
    </div>
  );
};
