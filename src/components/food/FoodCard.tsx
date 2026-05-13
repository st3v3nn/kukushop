import { Plus, Star, Heart, ShoppingBag } from 'lucide-react';
import { getImageURL, api, getMenuItemStartingPrice, getProductVariants } from '@/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem } from '@/lib/api';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { VariantDrawer } from './VariantDrawer';

interface FoodCardProps {
  item: MenuItem;
  variant?: 'default' | 'horizontal';
  className?: string;
}

export const FoodCard = ({ item, variant = 'default', className }: FoodCardProps) => {
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [secondaryReady, setSecondaryReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const productVariants = getProductVariants(item);
  const hasVariants = productVariants.length > 0;
  const displayPrice = getMenuItemStartingPrice(item);

  useEffect(() => {
    setSecondaryReady(false);
  }, [item.id, item.secondaryImage, item.secondary_image_url]);

  // Fetch favorites status on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      api.getFavorites()
        .then(favorites => {
          setIsFavorite(favorites.includes(item.id));
        })
        .catch(err => console.error('Failed to fetch favorites:', err));
    }
  }, [isAuthenticated, user, item.id]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasVariants) {
      setIsDrawerOpen(true);
      return;
    }

    addItem(item, 1);
    toast.success(`${item.name} added to cart!`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save favorites');
      return;
    }

    if (isTogglingFavorite) return;

    // Optimistic UI update
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    setIsTogglingFavorite(true);

    try {
      if (previousState) {
        await api.removeFavorite(item.id);
        toast.success('Removed from favorites');
      } else {
        await api.addFavorite(item.id);
        toast.success('Added to favorites');
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(previousState);
      toast.error('Failed to update favorites');
      console.error('Favorite toggle error:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (variant === 'horizontal') {
    const primaryImage = getImageURL(item.image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80');
    const secondaryImage = item.secondaryImage || item.secondary_image_url;
    const shouldRevealSecondary = Boolean(secondaryImage && secondaryReady);
    return (
      <>
        <Link
          to={`/meal/${item.id}`}
          className={cn(
            'food-card group flex gap-4 rounded-2xl bg-card p-4 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1',
            !item.is_available && 'opacity-60',
            className
          )}
        >
          <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-border/50">
            <img
              src={primaryImage}
              alt={item.name}
              className={cn(
                'h-full w-full object-cover transition-all duration-500',
                shouldRevealSecondary
                  ? 'group-hover:scale-[1.04] group-hover:opacity-[0.12] group-focus-within:scale-[1.04] group-focus-within:opacity-[0.12]'
                  : 'group-hover:scale-[1.03]'
              )}
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
            />
            {secondaryImage && (
              <img
                src={getImageURL(secondaryImage)}
                alt={`${item.name} alternate`}
                className={cn(
                  'absolute inset-0 h-full w-full object-cover scale-[1.02] opacity-0 transition-all duration-500',
                  shouldRevealSecondary && 'group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100'
                )}
                loading="lazy"
                onLoad={() => setSecondaryReady(true)}
                onError={() => setSecondaryReady(false)}
              />
            )}
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 active:scale-95"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-all',
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                )}
              />
            </button>
            {!item.isAvailable && !item.is_available && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
                <span className="text-xs font-semibold text-muted-foreground">Sold Out</span>
              </div>
            )}
            {item.isFeatured && item.is_featured && (
              <div className="absolute top-2 left-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-semibold">
                Featured
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between py-1">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-sm line-clamp-1 text-foreground">{item.name}</h3>
                {item.rating && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    <span className="text-xs font-semibold">{item.rating}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {item.description}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <PriceDisplay price={displayPrice} originalPrice={hasVariants ? undefined : item.originalPrice} size="sm" />
                {hasVariants && (
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {productVariants.length} size{productVariants.length > 1 ? 's' : ''} available
                  </p>
                )}
              </div>
              {(item.isAvailable ?? item.is_available) && (
                <button
                  onClick={handleQuickAdd}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-90 hover:bg-primary/90 shadow-md hover:shadow-lg"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </Link>
        <VariantDrawer 
          item={item} 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
        />
      </>
    );
  }

  const primaryImage = getImageURL(item.image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80');
  const secondaryImage = item.secondaryImage || item.secondary_image_url;
  const shouldRevealSecondary = Boolean(secondaryImage && secondaryReady);

  return (
    <>
      <Link
        to={`/meal/${item.id}`}
        className={cn(
          'food-card group block rounded-2xl bg-card overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1',
          !(item.isAvailable ?? item.is_available) && 'opacity-60',
          className
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-secondary ring-1 ring-border/20 mb-3">
          <img
            src={primaryImage}
            alt={item.name}
            className={cn(
              'h-full w-full object-cover transition-all duration-500',
              shouldRevealSecondary
                ? 'group-hover:scale-[1.04] group-hover:opacity-[0.14] group-focus-within:scale-[1.04] group-focus-within:opacity-[0.14]'
                : 'group-hover:scale-[1.03]'
            )}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
          />
          {secondaryImage && (
            <img
              src={getImageURL(secondaryImage)}
              alt={`${item.name} alternate`}
              className={cn(
                'absolute inset-0 h-full w-full object-cover scale-[1.02] opacity-0 transition-all duration-500',
                shouldRevealSecondary && 'group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100'
              )}
              loading="lazy"
              onLoad={() => setSecondaryReady(true)}
              onError={() => setSecondaryReady(false)}
            />
          )}
          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 active:scale-95"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-all',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              )}
            />
          </button>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
              SALE
            </span>
          )}
          {!(item.isAvailable ?? item.is_available) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-sm">
              <span className="text-sm font-semibold text-muted-foreground">Sold Out</span>
            </div>
          )}
          {item.rating && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 backdrop-blur-sm shadow-md ring-1 ring-border/50">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-xs font-bold">{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <h3 className="font-bold text-sm line-clamp-1 text-foreground mb-1">{item.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <PriceDisplay price={displayPrice} originalPrice={hasVariants ? undefined : item.originalPrice} size="sm" />
              {hasVariants && (
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  Choose a size
                </p>
              )}
            </div>
            {(item.isAvailable ?? item.is_available) && (
              <button
                onClick={handleQuickAdd}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-90 hover:bg-primary/90 shadow-md hover:shadow-lg"
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Link>
      <VariantDrawer 
        item={item} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
};
