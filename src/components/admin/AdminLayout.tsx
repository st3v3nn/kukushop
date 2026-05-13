import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  Bike,
  BarChart3,
  DollarSign,
  LogOut,
  Menu,
  X,
  Bell,
  Send,
  ArrowUp
} from 'lucide-react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: Package },
  { path: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/admin/customers', label: 'Customers', icon: User },
  { path: '/admin/riders', label: 'Riders', icon: Bike },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/mpesa', label: 'Payments', icon: DollarSign },
  { path: '/admin/notifications', label: 'Broadcast Center', icon: Send },
  { path: '/profile/notifications', label: 'My Notifications', icon: Bell },
];

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {

  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setShowScrollTop(target.scrollTop > 300);
    };

    const mainContent = mainContentRef.current;
    mainContent?.addEventListener('scroll', handleScroll);
    return () => mainContent?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };



  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div>
                <h1 className="font-bold text-sm">Kuku ni Sisi</h1>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-sm sm:text-xl font-semibold truncate max-w-[200px] sm:max-w-none">{title}</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto relative" ref={mainContentRef}>
          {children}
          
          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              aria-label="Scroll to top"
              title="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
};
