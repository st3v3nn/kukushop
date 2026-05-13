import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodCard } from '@/components/food/FoodCard';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FavoriteItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  category_id: string | null;
}

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const ids = await api.getFavorites();
      if (!ids || ids.length === 0) {
        setFavorites([]);
        return;
      }
      // Fetch menu items and filter by favorite ids
      const all = await api.getMenuItems();
      const favItems = all.filter((i) => ids.includes(i.id));
      setFavorites(favItems as any);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Favorites</h1>
        </header>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Favorites</h1>
      </header>

      <main className="px-4 py-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-6">
              Save your favorite meals for quick ordering
            </p>
            <Button onClick={() => navigate('/menu')}>
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favorites.map((item) => (
              <FoodCard key={item.id} item={{
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image_url,
                category: item.category_id || '',
                categoryId: item.category_id || '',
                isAvailable: item.is_available,
                isFeatured: item.is_featured,
                preparationTime: item.preparation_time,
              }} />
            ))}
          </div>
        )}
      </main>

      <ScrollToTopButton />
    </div>
  );
};

export default FavoritesPage;
