import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showCart?: boolean;
  transparent?: boolean;
  className?: string;
}

export const Header = ({
  title,
  showBack = false,
  showCart = true,
  transparent = false,
  className
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();


  const isHome = location.pathname === '/';

  return (
    <header className={cn(
      'sticky top-0 z-40 safe-top transition-colors xl:hidden',
      transparent ? 'bg-transparent' : 'bg-background/95 backdrop-blur-sm',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card transition-transform active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
          {isHome && (
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Deliver to</span>
                <span className="font-semibold text-sm">Nakuru, Kenya</span>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationCenter />
          {showCart && (
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card transition-transform active:scale-95"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
