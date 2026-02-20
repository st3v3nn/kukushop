import { Clock, ChefHat, Truck, CheckCircle2, XCircle, Package, UserCheck, MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/api';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<OrderStatus, {
  label: string;
  icon: typeof Clock;
  className: string;
}> = {
  created: {
    label: 'Pending Payment',
    icon: Clock,
    className: 'bg-orange-100 text-orange-700',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-warning/15 text-warning',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    className: 'bg-success/15 text-success',
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    className: 'bg-accent/20 text-accent-foreground',
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    icon: Package,
    className: 'bg-purple-100 text-purple-700',
  },
  on_the_way: {
    label: 'On the Way',
    icon: Truck,
    className: 'bg-primary/15 text-primary',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    className: 'bg-success/15 text-success',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive',
  },
  assigned: {
    label: 'Assigned',
    icon: UserCheck,
    className: 'bg-blue-100 text-blue-700',
  },
  picked_up: {
    label: 'Picked Up',
    icon: Truck,
    className: 'bg-indigo-100 text-indigo-700',
  },
  arrived: {
    label: 'Arrived',
    icon: MapPin,
    className: 'bg-emerald-100 text-emerald-700',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    className: 'bg-success/15 text-success',
  },
};


export const OrderStatusBadge = ({
  status,
  size = 'md',
  showIcon = true,
  className
}: OrderStatusBadgeProps) => {
  const config = statusConfig[status] || {
    label: (status || 'Unknown').replace('_', ' '),
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  };
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.className,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};


// Order progress tracker
interface OrderProgressProps {
  status: OrderStatus;
  className?: string;
}

const progressSteps: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'on_the_way', label: 'On the Way' },
  { status: 'delivered', label: 'Delivered' },
];

export const OrderProgress = ({ status, className }: OrderProgressProps) => {
  const currentIndex = progressSteps.findIndex(step => step.status === status);

  if (status === 'cancelled' || status === 'pending' || status === 'created') {
    return <OrderStatusBadge status={status} size="lg" />;
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between mb-2">
        {progressSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const StepIcon = statusConfig[step.status].icon;

          return (
            <div
              key={step.status}
              className={cn(
                'flex flex-col items-center gap-1 flex-1',
                isCompleted ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted',
                isCurrent && 'ring-2 ring-primary ring-offset-2 animate-pulse-ring'
              )}>
                <StepIcon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / progressSteps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};
