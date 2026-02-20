import { Search, UtensilsCrossed, Beef, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { FoodCard } from '@/components/food/FoodCard';
import { CategoryCard } from '@/components/food/CategoryCard';
import { PromoCarousel } from '@/components/promo/PromoBanner';
import { StickyCartButton } from '@/components/cart/StickyCartButton';
import { api } from '@/lib/api';
import type { Category, MenuItem } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const promoBanners = [
  {
    title: 'Restaurant Specials!',
    subtitle: 'Try our Choma Special & Pilau',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    link: '/menu?category=d40d8611-f118-41c5-9329-17a8b5a8e21c',
  },
  {
    title: 'Fresh from the Butchery',
    subtitle: 'Quality meat cuts at great prices',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
    link: '/menu?category=4bd8b74c-db3e-481b-9523-32caec7349b9',
  },
  {
    title: 'Fresh Groceries',
    subtitle: 'Farm-fresh produce delivered to you',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    link: '/menu?category=83b0fc2c-77b1-42ef-84f8-9ecdb522f7c6',
  },
];

export const HomePage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories from API
        const categoriesData = await api.getCategories();
        setCategories(categoriesData || []);

        // Fetch menu items from API
        const itemsData = await api.getMenuItems();
        setMenuItems(itemsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate item count for each category by filtering menu items
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    itemCount: menuItems.filter(item => item.categoryId === category.id).length,
  }));

  // Split items by category for display
  const restaurantItems = menuItems.filter(item => item.categoryId === categoriesWithCounts.find(c => c.name === 'Restaurant')?.id).slice(0, 4);
  const butcheryItems = menuItems.filter(item => item.categoryId === categoriesWithCounts.find(c => c.name === 'Butchery')?.id).slice(0, 4);
  const groceryItems = menuItems.filter(item => item.categoryId === categoriesWithCounts.find(c => c.name === 'Groceries')?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
      <Header />

      <main className="pb-4 lg:pb-0 px-4 md:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6 pt-4">
          <Link
            to="/menu"
            className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4 shadow-card hover:shadow-card-hover transition-all duration-300 ring-1 ring-border/50"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm font-medium">Search for meals...</span>
          </Link>
        </div>

        {/* Promo Banners */}
        <section className="mb-8">
          <PromoCarousel promos={promoBanners} />
        </section>

        {/* Categories - Horizontal Scroll */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-bold">Browse Categories</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 lg:overflow-visible lg:px-0 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4">
            {categoriesWithCounts.map(category => {
              // Get icon based on category name
              const getIconForCategory = (name: string) => {
                const lowerName = name.toLowerCase();
                if (lowerName.includes('restaurant')) {
                  return UtensilsCrossed;
                } else if (lowerName.includes('butcher')) {
                  return Beef;
                } else if (lowerName.includes('grocer')) {
                  return Leaf;
                }
                return UtensilsCrossed;
              };

              const IconComponent = getIconForCategory(category.name);

              return (
                <Link
                  key={category.id}
                  to={`/menu?category=${category.id}`}
                  className="flex-shrink-0 lg:flex-shrink flex flex-col items-center gap-3 px-1 py-4 rounded-2xl bg-card p-4 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Icon Badge */}
                  <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>

                  {/* Text */}
                  <div className="text-center">
                    <h3 className="font-bold text-foreground text-base line-clamp-1">{category.name}</h3>
                    <span className="text-xs text-muted-foreground font-medium">{category.itemCount || 0} items</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Items - Restaurant Section */}
        {restaurantItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-bold">Restaurant Specials</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {restaurantItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
            <Link
              to={`/menu${restaurantItems.length > 0 ? `?category=${categoriesWithCounts.find(c => c.name.toLowerCase() === 'restaurant')?.id}` : ''}`}
              className="block mt-4 text-center py-2 text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              View All Restaurant Items →
            </Link>
          </section>
        )}

        {/* Popular Items - Butchery Section */}
        {butcheryItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Beef className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-bold">Butchery & Meats</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {butcheryItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
            <Link
              to={`/menu${butcheryItems.length > 0 ? `?category=${categoriesWithCounts.find(c => c.name.toLowerCase().includes('butch'))?.id}` : ''}`}
              className="block mt-4 text-center py-2 text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              View All Butchery Items →
            </Link>
          </section>
        )}

        {/* Groceries Section */}
        {groceryItems.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🥬</span>
              <h2 className="text-xl font-bold">Fresh Groceries</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
              {groceryItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <StickyCartButton />
    </div>
  );
};

export default HomePage;
