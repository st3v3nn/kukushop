import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// Contexts
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";

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


// Pages - Rider
import RiderDashboardPage from "./pages/rider/RiderDashboardPage";

// Layout
import { AppLayout } from "./components/layout/AppLayout";

// Auth
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
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
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-center" />
              {/** Use object-based router and opt-in to v7 future flags to silence deprecation warnings */}
              <RouterProvider
                router={createBrowserRouter(
                  [
                    { path: "/onboarding", element: <OnboardingPage /> },
                    { path: "/login", element: <LoginPage /> },
                    { path: "/signup", element: <LoginPage /> },
                    { path: "/forgot-password", element: <ForgotPasswordPage /> },
                    { path: "/reset-password", element: <ResetPasswordPage /> },

                    // Main app routes (wrapped with AppLayout)
                    {
                      element: <AppLayout />,
                      children: [
                        { path: "/", element: <HomePage /> },
                        { path: "/menu", element: <MenuPage /> },
                        { path: "/menu/:id", element: <MealDetailsPage /> },
                        { path: "/cart", element: <CartPage /> },
                        {
                          path: "/checkout",
                          element: <ProtectedRoute allowedRoles={['customer', 'admin']}><CheckoutPage /></ProtectedRoute>
                        },
                        {
                          path: "/payment",
                          element: <ProtectedRoute allowedRoles={['customer', 'admin']}><PaymentPage /></ProtectedRoute>
                        },
                        {
                          path: "/orders",
                          element: <ProtectedRoute allowedRoles={['customer', 'admin']}><OrdersPage /></ProtectedRoute>
                        },
                        {
                          path: "/orders/:id",
                          element: <ProtectedRoute allowedRoles={['customer', 'admin', 'rider']}><OrderTrackingPage /></ProtectedRoute>
                        },
                        {
                          path: "/profile",
                          element: <ProtectedRoute><ProfilePage /></ProtectedRoute>
                        },
                        {
                          path: "/profile/edit",
                          element: <ProtectedRoute><EditProfilePage /></ProtectedRoute>
                        },
                        {
                          path: "/profile/addresses",
                          element: <ProtectedRoute><AddressesPage /></ProtectedRoute>
                        },
                        {
                          path: "/profile/payments",
                          element: <ProtectedRoute><PaymentsPage /></ProtectedRoute>
                        },
                        {
                          path: "/profile/notifications",
                          element: <ProtectedRoute><NotificationsPage /></ProtectedRoute>
                        },
                        {
                          path: "/favorites",
                          element: <ProtectedRoute><FavoritesPage /></ProtectedRoute>
                        },
                        {
                          path: "/settings",
                          element: <ProtectedRoute><SettingsPage /></ProtectedRoute>
                        },
                        { path: "/order-confirmation/:id", element: <OrderConfirmationPage /> },
                        { path: "/help", element: <HelpPage /> }
                      ]
                    },


                    // Admin
                    {
                      path: "/admin",
                      element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>
                    },
                    {
                      path: "/admin/dashboard",
                      element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>
                    },
                    {
                      path: "/admin/orders",
                      element: <ProtectedRoute allowedRoles={['admin']}><AdminOrdersPage /></ProtectedRoute>
                    },
                    {
                      path: "/admin/riders",
                      element: <ProtectedRoute allowedRoles={['admin']}><AdminRidersPage /></ProtectedRoute>
                    },
                    {
                      path: "/admin/menu",
                      element: <ProtectedRoute allowedRoles={['admin']}><AdminMenuPage /></ProtectedRoute>
                    },
                    {
                      path: "/admin/reports",
                      element: <ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>
                    },


                    // Rider
                    {
                      path: "/rider",
                      element: <ProtectedRoute allowedRoles={['rider']}><RiderDashboardPage /></ProtectedRoute>
                    },
                    {
                      path: "/rider/dashboard",
                      element: <ProtectedRoute allowedRoles={['rider']}><RiderDashboardPage /></ProtectedRoute>
                    },

                    // Catch-all
                    { path: "*", element: <NotFound /> }
                  ],

                  {
                    future: {
                      v7_relativeSplatPath: true,
                      // @ts-expect-error - Future flag for v7
                      v7_startTransition: true
                    }
                  }
                )}
              />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
