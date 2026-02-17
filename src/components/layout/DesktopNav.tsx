import { Home, Search, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import { Input } from '@/components/ui/input';
const navItems = [{
  label: 'Home',
  path: '/'
}, {
  label: 'Menu',
  path: '/menu'
}, {
  label: 'Orders',
  path: '/orders'
}];
interface DesktopNavProps {
  children: React.ReactNode;
}
export const DesktopNav = ({
  children
}: DesktopNavProps) => {
  const location = useLocation();
  const {
    itemCount
  } = useCart();

  return <div className="min-h-screen bg-background">
    {/* Desktop Header */}
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-bold text-xl">Speedy Bites</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden xl:flex items-center gap-6">
              {navItems.map(({
                label,
                path
              }) => {
                const isActive = location.pathname === path || path !== '/' && location.pathname.startsWith(path);
                return <Link key={path} to={path} className={cn('text-sm font-medium transition-colors hover:text-primary', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {label}
                </Link>;
              })}
            </nav>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <Link to="/menu" className="block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Search for meals..." className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 cursor-pointer" readOnly />
              </div>
            </Link>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link to="/cart" className="relative flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount > 99 ? '99+' : itemCount}
              </span>}
            </Link>
            <Link to="/profile" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="container mx-auto max-w-7xl px-6 py-8">
      {children}
    </main>
  </div>;
};