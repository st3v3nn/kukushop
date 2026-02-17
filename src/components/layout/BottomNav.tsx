import { Home, Search, ShoppingBag, ClipboardList, User, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const baseNav = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Menu', path: '/menu' },
  { icon: ShoppingBag, label: 'Cart', path: '/cart' },
  { icon: ClipboardList, label: 'Orders', path: '/orders' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();

  // Build nav items dynamically so we can add a Dashboard link for admins and riders
  const navItems = [...baseNav];
  if (user && (user.role === 'admin' || user.role === 'rider')) {
    const dashboardPath = user.role === 'admin' ? '/admin' : '/rider';
    // insert before profile (last item)
    navItems.splice(navItems.length - 1, 0, { icon: LayoutDashboard, label: 'Dashboard', path: dashboardPath });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow-bottom-nav safe-bottom xl:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          const isCart = path === '/cart';

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'nav-item relative',
                isActive && 'active'
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  'h-6 w-6 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                {isCart && itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce-in">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
