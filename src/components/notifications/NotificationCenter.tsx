import { useState, useEffect } from 'react';
import { Bell, X, Package, Bike, CheckCircle, Clock, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/contexts/NotificationContext';

interface NotificationCenterProps {
  className?: string;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order_confirmed':
      return <CheckCircle className="h-5 w-5 text-success" />;
    case 'preparing':
      return <ChefHat className="h-5 w-5 text-warning" />;
    case 'on_the_way':
      return <Bike className="h-5 w-5 text-primary" />;
    case 'delivered':
    case 'payment_received':
      return <Package className="h-5 w-5 text-success" />;
    case 'new_order':
      return <Package className="h-5 w-5 text-accent" />;
    case 'assigned':
      return <Bike className="h-5 w-5 text-primary" />;
    case 'payment_failed':
      return <X className="h-5 w-5 text-destructive" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const NotificationCenter = ({
  className
}: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card transition-transform active:scale-95",
          className
        )}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          <div className="sr-only">
            View your recent notifications and order updates
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </SheetHeader>

        <div className="mt-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-all relative overflow-hidden group cursor-pointer",
                  notification.read ? "bg-background opacity-70" : "bg-primary/5 border-primary/20 shadow-sm"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold truncate pr-16">{notification.title}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notification.message}
                  </p>
                  {notification.orderId && (
                    <div className="mt-2 text-[10px] font-bold text-primary">
                      Order: #{notification.orderId.slice(-6).toUpperCase()}
                    </div>
                  )}
                </div>
                {!notification.read && (
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
