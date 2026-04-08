import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary/30 border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  );
};

export const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="rounded-xl bg-card p-4 shadow-card animate-pulse">
    <div className="aspect-square w-full rounded-lg bg-muted mb-3" />
    <div className="h-4 w-3/4 rounded bg-muted mb-2" />
    <div className="h-3 w-1/2 rounded bg-muted" />
  </div>
);

export const SkeletonList = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
