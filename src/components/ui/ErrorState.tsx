import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isOffline?: boolean;
  className?: string;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  onRetry,
  isOffline = false,
  className
}: ErrorStateProps) => {
  const Icon = isOffline ? WifiOff : AlertTriangle;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center px-6 py-12 text-center',
      className
    )}>
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-10 w-10 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{isOffline ? "You're offline" : title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {isOffline 
          ? "Please check your internet connection and try again."
          : message
        }
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export const OfflineIndicator = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive px-4 py-2 text-center">
      <p className="text-sm font-medium text-destructive-foreground">
        You're offline. Some features may be unavailable.
      </p>
    </div>
  );
};
