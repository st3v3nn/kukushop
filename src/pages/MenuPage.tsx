import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { FoodCard } from '@/components/food/FoodCard';
import { StickyCartButton } from '@/components/cart/StickyCartButton';
import { EmptySearch } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Category, MenuItem } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesData = await api.getCategories();
        setCategories(categoriesData || []);

        // Fetch menu items
        const itemsData = await api.getMenuItems();
        setMenuItems(itemsData || []);

      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by category
    if (activeCategory !== 'all') {
      items = items.filter(item => item.categoryId === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }, [activeCategory, searchQuery, menuItems]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
      <Header title="Menu" showBack />

      <main className="pb-4 lg:pb-0 px-4 md:px-6">
        {/* Search Bar - Hidden on desktop */}
        <div className="px-4 mb-4 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 bg-card shadow-card"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
          <button
            onClick={() => handleCategoryChange('all')}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground shadow-card'
            )}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground shadow-card'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div>
          {filteredItems.length === 0 ? (
            <EmptySearch query={searchQuery} onClear={clearSearch} />
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <StickyCartButton />
    </div>
  );
};

export default MenuPage;
