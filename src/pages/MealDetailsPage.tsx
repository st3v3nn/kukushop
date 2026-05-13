import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Star } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { PriceDisplay, formatPrice } from '@/components/ui/PriceDisplay';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { getImageURL } from '@/lib/api';
import { getProductVariants, getSelectedProductVariant, resolveMenuItemUnitPrice } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/api';
import { toast } from 'sonner';

export const MealDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, addItems } = useCart();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadMenuItem = async () => {
      try {
        if (!id) return;
        const data = await api.getMenuItem(id);
        setItem(data as MenuItem);
      } catch (error) {
        console.error('Error fetching menu item:', error);
        toast.error('Failed to load item');
        navigate('/menu');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      void loadMenuItem();
      if (user) {
        // TODO: Implement favorites API endpoint
        // For now, favorites are stored in local state only
      }
    }
  }, [id, navigate, user]);

  const toggleFavorite = async () => {
    // Local state toggle for favorites - full API implementation to follow
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  useEffect(() => {
    // Reset quantities when item change (standard/base becomes qty 1 by default)
    if (item) {
      setVariantQuantities({ 'Standard / Base': 1 });
    }
  }, [item]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
        <Header showBack />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading item...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
        <Header showBack />
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <p className="text-muted-foreground">Item not found</p>
          <Button onClick={() => navigate('/menu')} className="mt-4">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  const productVariants = getProductVariants(item);

  const handleAddAll = () => {
    const selections = Object.entries(variantQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([name, qty]) => ({
        variant: name === 'Standard / Base' ? undefined : name,
        quantity: qty
      }));

    if (selections.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    addItems(item, selections);
    
    const totalQty = selections.reduce((sum, s) => sum + s.quantity, 0);
    toast.success(`Added ${totalQty} item${totalQty > 1 ? 's' : ''} to cart!`);
  };

  const allDisplayVariants = [
    { id: 'base', name: 'Standard / Base', price: item.price },
    ...productVariants
  ];

  const totalPrice = allDisplayVariants.reduce((sum, v) => sum + ((Number(v.price) || 0) * (variantQuantities[v.name] || 0)), 0);
  const totalSelectedCount = Object.values(variantQuantities).reduce((sum, q) => sum + q, 0);

  const updateVariantQuantity = (name: string, qty: number) => {
    setVariantQuantities(prev => ({
      ...prev,
      [name]: Math.max(0, qty)
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:min-h-0 lg:bg-transparent lg:pb-0">
      {/* Hero Image */}
      <div className="relative h-80 bg-muted overflow-hidden">
        <img
          src={getImageURL(item.image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80')}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10" />

        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0">
          <Header showBack transparent showCart />
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={toggleFavorite}
            disabled={isFavoriteLoading}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm shadow-card transition-colors disabled:opacity-50',
              isFavorite && 'bg-primary text-primary-foreground'
            )}
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm shadow-card">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Discount badge */}
        {item.originalPrice && item.originalPrice > item.price && (
          <div className="absolute top-20 left-4 rounded-full bg-primary px-3 py-1">
            <span className="text-sm font-bold text-primary-foreground">
              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative -mt-6 rounded-t-3xl bg-background px-4 pt-6">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">{item.category}</span>
          {item.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-bold mb-2">{item.name}</h1>

        {/* Price */}
        <PriceDisplay
          price={item.price}
          originalPrice={item.originalPrice}
          size="xl"
          className="mb-4"
        />

        <div className="mb-8 p-1">
          <h3 className="mb-4 text-lg font-bold">Selection Options</h3>
          <div className="space-y-4">
            {allDisplayVariants.map((v) => (
              <div
                key={v.id}
                className={cn(
                  "flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all",
                  variantQuantities[v.name] > 0 ? "border-primary/50 bg-primary/5" : "border-border"
                )}
              >
                <div className="flex-1">
                  <h4 className="font-bold">{v.name}</h4>
                  <p className="text-xl font-black text-primary">{formatPrice(v.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <QuantitySelector 
                    quantity={variantQuantities[v.name] || 0} 
                    onChange={(qty) => updateVariantQuantity(v.name, qty)} 
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Customize your order by selecting one or more variants.
          </p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground leading-relaxed">{item.description}</p>
        </div>

        {/* Availability */}
        {!item.isAvailable && (
          <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">
              This item is currently unavailable
            </p>
          </div>
        )}

        {/* Description section removed quantity duplicate */}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-4 shadow-bottom-nav safe-bottom">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Selection Total</span>
            <p className="text-xl font-black text-foreground">{formatPrice(totalPrice)}</p>
          </div>
          <Button
            onClick={handleAddAll}
            disabled={!item.isAvailable || totalSelectedCount === 0}
            className="h-14 flex-[2] rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
            size="lg"
          >
            Add {totalSelectedCount > 0 ? `${totalSelectedCount} Selected` : 'to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MealDetailsPage;
