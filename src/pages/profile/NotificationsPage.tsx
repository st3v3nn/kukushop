import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, X, Package, Bike, CheckCircle, ChefHat, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, deleteNotification, clearNotifications, isLoading } = useNotifications();

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

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-lg font-semibold">Notifications</h1>
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <>
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8 px-2">
                                Read All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-destructive hover:text-destructive text-xs h-8 px-2">
                                Clear All
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <main className="px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                            <Bell className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">No notifications yet</h3>
                        <p className="text-muted-foreground">
                            We'll let you know when there are updates about your orders.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                                className={cn(
                                    "flex gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden group cursor-pointer",
                                    notification.read ? "bg-background/50 opacity-80" : "bg-card border-primary/20 shadow-md ring-1 ring-primary/5"
                                )}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className={cn("text-sm font-bold truncate pr-2", !notification.read && "text-foreground")}>
                                            {notification.title}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatTimeAgo(notification.timestamp)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {notification.message}
                                    </p>
                                    {notification.orderId && (
                                        <div className="mt-2 text-xs font-bold text-primary">
                                            Order: #{notification.orderId.slice(-6).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {!notification.read && (
                                    <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};


export default NotificationsPage;
