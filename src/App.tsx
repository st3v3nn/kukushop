import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// Contexts
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from '@/contexts/NotificationContext';

// Splash Screen
import SplashScreen from "./pages/SplashScreen";

// Pages - Customer
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import MealDetailsPage from "./pages/MealDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import OrdersPage from "./pages/OrdersPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";


// Profile Sub-Pages
import EditProfilePage from "./pages/profile/EditProfilePage";
import AddressesPage from "./pages/profile/AddressesPage";
import PaymentsPage from "./pages/profile/PaymentsPage";
import NotificationsPage from "./pages/profile/NotificationsPage";
import FavoritesPage from "./pages/FavoritesPage";
import SettingsPage from "./pages/SettingsPage";

// Pages - Admin
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMenuPage from "./pages/admin/AdminMenuPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminRidersPage from "./pages/admin/AdminRidersPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminMpesaPage from "./pages/admin/AdminMpesaPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";


// Pages - Rider
import RiderDashboardPage from "./pages/rider/RiderDashboardPage";

// Layout
import { AppLayout } from "./components/layout/AppLayout";

// Auth
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const router = createBrowserRouter(
  [
    { path: "/onboarding", element: <OnboardingPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <OnboardingPage /> }, // Map register to onboarding as per current flow
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },

    {
      element: <AppLayout />,
      children: [
        { path: "/", element: <HomePage /> },
        { path: "/menu", element: <MenuPage /> },
        { path: "/meal/:id", element: <MealDetailsPage /> },
        { path: "/cart", element: <CartPage /> },
        { path: "/checkout", element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
        { path: "/payment/:orderId", element: <ProtectedRoute><PaymentPage /></ProtectedRoute> },
        { path: "/orders", element: <ProtectedRoute><OrdersPage /></ProtectedRoute> },
        { path: "/order/:id", element: <ProtectedRoute><OrderTrackingPage /></ProtectedRoute> },
        { path: "/order-confirmation/:orderId", element: <OrderConfirmationPage /> },
        { path: "/profile", element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
        { path: "/help", element: <HelpPage /> },
        { path: "/profile/edit", element: <ProtectedRoute><EditProfilePage /></ProtectedRoute> },
        { path: "/profile/addresses", element: <ProtectedRoute><AddressesPage /></ProtectedRoute> },
        { path: "/profile/payments", element: <ProtectedRoute><PaymentsPage /></ProtectedRoute> },
        { path: "/profile/notifications", element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
        { path: "/favorites", element: <ProtectedRoute><FavoritesPage /></ProtectedRoute> },
        { path: "/settings", element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      ]
    },

    // Rider Routes
    { path: "/rider", element: <ProtectedRoute allowedRoles={['rider']}><RiderDashboardPage /></ProtectedRoute> },
    { path: "/rider/dashboard", element: <ProtectedRoute allowedRoles={['rider']}><RiderDashboardPage /></ProtectedRoute> },

    // Admin Routes
    { path: "/admin", element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute> },
    { path: "/admin/dashboard", element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute> },
    { path: "/admin/menu", element: <ProtectedRoute allowedRoles={['admin']}><AdminMenuPage /></ProtectedRoute> },
    { path: "/admin/orders", element: <ProtectedRoute allowedRoles={['admin']}><AdminOrdersPage /></ProtectedRoute> },
    { path: "/admin/riders", element: <ProtectedRoute allowedRoles={['admin']}><AdminRidersPage /></ProtectedRoute> },
    { path: "/admin/reports", element: <ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute> },
    { path: "/admin/mpesa", element: <ProtectedRoute allowedRoles={['admin']}><AdminMpesaPage /></ProtectedRoute> },
    { path: "/admin/notifications", element: <ProtectedRoute allowedRoles={['admin']}><AdminNotificationsPage /></ProtectedRoute> },
    { path: "/admin/customers", element: <ProtectedRoute allowedRoles={['admin']}><AdminCustomersPage /></ProtectedRoute> },

    { path: "*", element: <NotFound /> },
  ],

  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
      // @ts-expect-error - Future flag for v7
      v7_startTransition: true
    }
  }
);

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    armSplashToneOnFirstInteraction();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SplashScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner position="top-center" />
                {/* Global SSE for payment updates and notifications */}
                <SseListener />
                {/** Use object-based router and opt-in to v7 future flags to silence deprecation warnings */}
                <RouterProvider
                  router={router}
                  future={{
                    v7_startTransition: true,
                  }}
                />
              </TooltipProvider>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;

// SSE listener component
import React from 'react';
import { API_BASE_URL } from '@/lib/api';
import { armSplashToneOnFirstInteraction, playNotificationTune } from '@/lib/sound';

import { useNotifications } from '@/contexts/NotificationContext';

function SseListener() {
  const { addNotification } = useNotifications();
  const token = localStorage.getItem('speedy_bites_auth_token');

  React.useEffect(() => {
    let es: EventSource | null = null;
    const token = localStorage.getItem('speedy_bites_auth_token');
    if (!token) return;
    const base = API_BASE_URL.replace(/\/api$/, '');
    const streamUrl = token ? `${base}/api/stream?token=${encodeURIComponent(token)}` : `${base}/api/stream`;
    try {
      es = new EventSource(streamUrl);
    } catch (err) {
      return;
    }
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (!payload || !payload.type) return;

        if (payload.type === 'payment.updated') {
          const order = payload.order || {};
          const status = order.payment_status || 'updated';
          toast.success(`Payment ${status} for order ${order.id ? order.id.slice(0, 8) : ''}`);
        } else if (payload.type === 'notification.new') {
          console.log('Received notification event:', payload);
          if (payload.notification) {
            // Verify if this notification is for the current user
            // We need to decode the token again or passed via props, but SseListener is inside AuthProvider?
            // Actually, we can just use the user object from context if we move SseListener inside
            // But SseListener IS inside.
            // Let's get user from local storage token to be safe and fast without hooks dependecy loop
            try {
              const token = localStorage.getItem('speedy_bites_auth_token');
              if (token) {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const session = JSON.parse(jsonPayload);

                if (payload.notification.user_id && session.id &&
                  payload.notification.user_id.toString().toLowerCase() !== session.id.toString().toLowerCase()) {
                  console.log(`Ignoring notification for another user (target: ${payload.notification.user_id}, current: ${session.id})`);
                  return;
                }
              }
            } catch (e) {
              console.error('Error checking notification owner:', e);
            }

            addNotification(payload.notification);
          }
        } else if (payload.type === 'notification.broadcast') {
          // For broadcasts, since it's already in the DB for all users,
          // we show a toast and refetch.
          toast(payload.title || 'New Announcement', {
            description: payload.message,
          });
          // Play sound also handled via addNotification usually, but for broadcast we do it here
          playNotificationTune();

          // Trigger a refresh of the notifications list
          window.dispatchEvent(new CustomEvent('notifications-refresh'));
        }
      } catch (err) {
        // ignore
      }
    };
    es.onerror = () => {
      if (es) es.close();
    };
    return () => { if (es) es.close(); };
  }, [addNotification, token]);
  return null;
}
