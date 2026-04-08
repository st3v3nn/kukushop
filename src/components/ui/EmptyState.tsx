import { LucideIcon, ShoppingBag, Package, Search, MapPin } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon = Package,
  title,
  description,
  action,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center px-6 py-12 text-center',
      className
    )}>
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export const EmptyCart = ({ onBrowse }: { onBrowse: () => void }) => (
  <EmptyState
    icon={ShoppingBag}
    title="Your cart is empty"
    description="Looks like you haven't added any delicious items yet. Start browsing our menu!"
    action={{ label: 'Browse Menu', onClick: onBrowse }}
  />
);

export const EmptyOrders = ({ onBrowse }: { onBrowse: () => void }) => (
  <EmptyState
    icon={Package}
    title="No orders yet"
    description="You haven't placed any orders. Start by exploring our tasty menu!"
    action={{ label: 'Order Now', onClick: onBrowse }}
  />
);

export const EmptySearch = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${query}"`}
    description="Try a different search term or browse our categories."
    action={{ label: 'Clear Search', onClick: onClear }}
  />
);

export const NoLocation = ({ onEnable }: { onEnable: () => void }) => (
  <EmptyState
    icon={MapPin}
    title="Enable location"
    description="We need your location to show you nearby restaurants and delivery options."
    action={{ label: 'Enable Location', onClick: onEnable }}
  />
);
