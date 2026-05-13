import { Search, UtensilsCrossed, Beef, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { FoodCard } from '@/components/food/FoodCard';
import { PromoCarousel } from '@/components/promo/PromoBanner';
import { StickyCartButton } from '@/components/cart/StickyCartButton';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { api, getImageURL } from '@/lib/api';
import type { Category, MenuItem } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  // Order categories: place Cafe/Restaurant first, then follow the browse categories order
  const orderedCategories = (() => {
    // clone to avoid mutating original
    const cats = [...categoriesWithCounts];
    const cafeIndex = cats.findIndex(c => /cafe|restaurant/i.test(c.name));
    if (cafeIndex > -1) {
      const [cafe] = cats.splice(cafeIndex, 1);
      cats.unshift(cafe);
    }
    return cats;
  })();
  const getDisplayName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('restaurant') || lower.includes('rest')) return 'Cafe';
    if (lower.includes('butch') || lower.includes('butcher')) return 'Butchery';
    if (lower.includes('groc') || lower.includes('grocer') || lower.includes('groceries')) return 'Sokoni';
    return name;
  };
  const isUploadedAsset = (path?: string | null) => typeof path === 'string' && path.startsWith('/uploads/');

  // 1. Featured Item Banners (Legacy items that are featured)
  const featuredPromoBanners = menuItems
    .filter((item) => (item.isFeatured || item.is_featured) && (isUploadedAsset(item.image) || isUploadedAsset(item.image_url) || isUploadedAsset(item.secondaryImage) || isUploadedAsset(item.secondary_image_url)))
    .slice(0, 2)
    .map((item) => ({
      title: item.name,
      subtitle: item.description || `Fresh from ${item.category || 'our menu'}`,
      image: getImageURL(item.image || item.image_url || item.secondaryImage || item.secondary_image_url || '/placeholder.svg'),
      link: `/meal/${item.id}`,
    }));

  // 2. Category Banners (Cafe, Butchery, Sokoni)
  const categoryPromoBanners = orderedCategories
    .filter((category) => isUploadedAsset(category.image))
    .slice(0, 4) // Increase limit to ensure we find Sokoni
    .map((category) => ({
      title: `${getDisplayName(category.name)} Specials`,
      subtitle: category.description || 'Fresh selections from this category',
      image: getImageURL(category.image || '/placeholder.svg'),
      link: `/menu?category=${category.id}`,
      categoryName: getDisplayName(category.name),
    }));

  // Combine them: Start with featured items
  const promoBanners = [...featuredPromoBanners];
  
  // Add category banners following the orderedCategories display order
  categoryPromoBanners.forEach(catBanner => {
    // Avoid adding category if we already have it in items or if it's already added
    if (promoBanners.length < 4 && !promoBanners.some(existing => existing.link === catBanner.link)) {
      promoBanners.push(catBanner);
    }
  });

  const beveragesCategory = orderedCategories.find((category) => /beverage|drink/i.test(category.name));
  const snacksCategory = orderedCategories.find((category) => /snack/i.test(category.name));
  const beveragesAndSnacksBanner = (() => {
    const primaryCategory = beveragesCategory || snacksCategory || orderedCategories[0];
    if (!primaryCategory) return null;
    const secondaryCategory = beveragesCategory && snacksCategory && beveragesCategory.id !== snacksCategory.id
      ? snacksCategory
      : null;
    const primaryImage = isUploadedAsset(primaryCategory.image)
      ? primaryCategory.image
      : (menuItems.find((item) => item.categoryId === primaryCategory.id && (isUploadedAsset(item.image) || isUploadedAsset(item.image_url)))?.image || '');
    const secondaryImage = secondaryCategory
      ? ((isUploadedAsset(secondaryCategory.image)
        ? secondaryCategory.image
        : (menuItems.find((item) => item.categoryId === secondaryCategory.id && (isUploadedAsset(item.image) || isUploadedAsset(item.image_url)))?.image || '')))
      : '';
    const subtitle = [primaryCategory.description, secondaryCategory?.description].filter(Boolean).join(' • ');

    return {
      title: 'Beverages & Snacks',
      subtitle: subtitle || 'Refreshments and light bites for every craving',
      image: getImageURL(primaryImage || secondaryImage || '/placeholder.svg'),
      link: `/menu?category=${primaryCategory.id}`,
    };
  })();
  const bannerList = (beveragesAndSnacksBanner && promoBanners.length < 4)
    ? [...promoBanners, beveragesAndSnacksBanner]
    : promoBanners;

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
          <PromoCarousel promos={bannerList} />
        </section>

        {/* Categories - Horizontal Scroll */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-bold">Browse Kuku ni Sisi Menus</h2>
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

              return (
                <Link
                  key={category.id}
                  to={`/menu?category=${category.id}`}
                  className="flex-shrink-0 lg:flex-shrink flex flex-col items-center gap-3 px-1 py-4 rounded-2xl bg-card p-4 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Icon Badge */}
                      <div className="overflow-hidden rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300 w-full h-24">
                        {category.image ? (
                          <img
                            src={getImageURL(category.image)}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">{getDisplayName(category.name).slice(0,1)}</div>
                        )}
                      </div>

                  {/* Text */}
                  <div className="text-center">
                    <h3 className="font-bold text-foreground text-base line-clamp-1">{getDisplayName(category.name)}</h3>
                    <span className="text-xs text-muted-foreground font-medium">{category.itemCount || 0} items</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Sections for each category (4 items each) in browse order, Cafe first */}
        {orderedCategories.map(category => {
          const items = menuItems.filter(item => item.categoryId === category.id).slice(0, 4);
          if (!items || items.length === 0) return null;

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

          const displayName = (name: string) => {
            const lower = name.toLowerCase();
            if (lower.includes('restaurant') || lower.includes('rest')) return 'Kuku ni Sisi Cafe';
            if (lower.includes('butch') || lower.includes('butcher')) return 'Kuku ni Sisi Butchery';
            if (lower.includes('groc') || lower.includes('grocer') || lower.includes('groceries')) return 'Sokoni';
            return name;
          };

          const IconComponent = getIconForCategory(category.name);

          return (
            <section className="mb-8" key={category.id}>
              <div className="flex items-center gap-2 mb-4">
                <IconComponent className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold">{displayName(category.name)}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {items.map(item => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
              <Link
                to={`/menu${items.length > 0 ? `?category=${category.id}` : ''}`}
                className="block mt-4 text-center py-2 text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                View All {displayName(category.name)} Items →
              </Link>
            </section>
          );
        })}
      </main>

      <ScrollToTopButton />
      <StickyCartButton />
    </div>
  );
};

export default HomePage;
