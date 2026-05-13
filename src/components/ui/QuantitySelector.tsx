import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showDelete?: boolean;
  className?: string;
}

export const QuantitySelector = ({
  quantity,
  onChange,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  size = 'md',
  showDelete = false,
  className
}: QuantitySelectorProps) => {
  const canDecrease = quantity > min;
  const canIncrease = quantity < max;
  const isAtMin = quantity <= min;

  const sizeClasses = {
    sm: 'h-7 text-sm gap-1',
    md: 'h-9 text-base gap-2',
    lg: 'h-11 text-lg gap-3',
  };

  const buttonSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const handleDecrease = () => {
    if (canDecrease) {
      onChange(quantity - 1);
    } else if (showDelete) {
      onChange(0); // Trigger delete
    }
  };

  return (
    <div className={cn(
      'flex items-center rounded-full border border-border/80 bg-card text-foreground shadow-sm',
      sizeClasses[size],
      className
    )}>
      <button
        onClick={handleDecrease}
        disabled={!canDecrease && !showDelete}
        className={cn(
          'flex items-center justify-center rounded-full text-foreground transition-all active:scale-95',
          buttonSizes[size],
          isAtMin && showDelete 
            ? 'bg-destructive/10 text-destructive hover:bg-destructive/15' 
            : 'bg-muted hover:bg-muted/80',
          !canDecrease && !showDelete && 'opacity-40'
        )}
        aria-label={isAtMin && showDelete ? 'Remove item' : 'Decrease quantity'}
      >
        {isAtMin && showDelete ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </button>
      
      <span className="min-w-[2rem] text-center font-semibold text-foreground">
        {quantity}
      </span>
      
      <button
        onClick={() => canIncrease && onChange(quantity + 1)}
        disabled={!canIncrease}
        className={cn(
          'flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all active:scale-95 hover:bg-primary/90',
          buttonSizes[size],
          !canIncrease && 'opacity-40'
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};
