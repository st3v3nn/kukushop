import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Settings,
  Heart,
  Moon,
  Sun,
  LayoutDashboard
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const menuItems = [
  { icon: User, label: 'Edit Profile', path: '/profile/edit' },
  { icon: MapPin, label: 'Saved Addresses', path: '/profile/addresses' },
  { icon: Heart, label: 'Favorites', path: '/favorites' },
  { icon: CreditCard, label: 'Payment Methods', path: '/profile/payments' },
  { icon: Bell, label: 'Notifications', path: '/profile/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help & Support', path: '/help' },
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background pb-8 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <Header title="Profile" />

      <main className="px-4 py-4">
        {/* User Info */}
        <section className="mb-6 rounded-xl bg-card p-4 shadow-card">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{user.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <button
                onClick={() => navigate('/profile/edit')}
                className="text-sm font-medium text-primary"
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="mb-4 text-muted-foreground">Sign in to access your account</p>
              <Button onClick={() => navigate('/')}>
                Sign In
              </Button>
            </div>
          )}
        </section>

        {/* Menu Items */}
        <section className="mb-6 rounded-xl bg-card shadow-card overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50',
                  index !== menuItems.length - 1 && 'border-b'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </section>

        {/* Admin Section */}
        {isAuthenticated && user?.role === 'admin' && (
          <section className="mb-6 rounded-xl bg-card shadow-card overflow-hidden border border-amber-200 dark:border-amber-900">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 px-4 py-2 border-b border-amber-200 dark:border-amber-900">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Admin Tools</p>
            </div>
            <button
              onClick={() => navigate('/admin/menu')}
              className="flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 border-b"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <LayoutDashboard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="flex-1 text-left font-medium">Admin Dashboard</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </section>
        )}

        {/* Dark Mode Toggle */}
        <section className="mb-6 rounded-xl bg-card shadow-card overflow-hidden">
          <div className="flex w-full items-center gap-4 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <span className="flex-1 font-medium">Dark Mode</span>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </section>

        {/* Logout */}
        {isAuthenticated && (
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        )}

        {/* App Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Kuku ni Sisi v1.0.0</p>
          <p className="mt-1">
            <a
              href="https://buildsbysteve.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold inline-block animate-pulse hover:animate-bounce transition-transform"
              aria-label="Builds by Steve website"
            >
              Work by BuildsbySteve.co.ke
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
