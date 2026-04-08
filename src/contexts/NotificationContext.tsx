import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    type: 'order_confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'new_order' | 'assigned' | 'info' | 'success' | 'warning' | 'error' | 'payment_received' | 'payment_failed';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    orderId?: string;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    addNotification: (notification: any) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearNotifications: () => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    // Sound effect for notifications
    const playNotificationSound = () => {
        try {
            const audio = new Audio('/assets/sounds/chicken.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Audio play failed:', e));
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    };



    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        try {
            const data = await api.getNotifications();
            const mapped = (data || []).map((n: any) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                timestamp: new Date(n.created_at || n.createdAt || new Date()),
                read: n.is_read ?? n.read ?? false,
                orderId: n.data?.orderId,
                data: n.data
            }));
            console.log('Fetched notifications:', mapped.length);
            setNotifications(mapped);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();

        // Listen for refresh events
        const handleRefresh = () => {
            console.log('Refreshing notifications via event');
            fetchNotifications();
        };
        window.addEventListener('notifications-refresh', handleRefresh);

        // Polling as a fallback (SSE handles real-time)
        const interval = setInterval(fetchNotifications, 60000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('notifications-refresh', handleRefresh);
        };
    }, [user]);

    const addNotification = useCallback((n: any) => {
        console.log('Adding notification:', n);
        const newNotification = {
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at || n.createdAt || new Date()),
            read: n.is_read ?? n.read ?? false,
            orderId: n.data?.orderId,
            data: n.data
        };
        setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(existing => existing.id === newNotification.id)) return prev;

            // Show toast for new notification
            toast(newNotification.title, {
                description: newNotification.message,
            });

            // Play sound
            playNotificationSound();

            return [newNotification, ...prev];
        });
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        try {
            await api.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    }, []);

    const clearNotifications = useCallback(async () => {
        try {
            await api.clearNotifications();
            setNotifications([]);
            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            toast.error('Failed to clear notifications');
        }
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const value = React.useMemo(() => ({
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearNotifications,
        refresh: fetchNotifications
    }), [notifications, unreadCount, isLoading, addNotification, markAsRead, markAllAsRead, deleteNotification, clearNotifications, fetchNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
