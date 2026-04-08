import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/api';

interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'compact';
  className?: string;
}

export const CategoryCard = ({ category, variant = 'default', className }: CategoryCardProps) => {
  if (variant === 'compact') {
    return (
      <Link
        to={`/menu?category=${category.id}`}
        className={cn(
          'flex flex-col items-center gap-3 transition-transform duration-300 hover:scale-105 active:scale-95',
          className
        )}
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-background ring-2 ring-primary/20 shadow-md hover:shadow-lg transition-all duration-300">
          <img 
            src={category.image} 
            alt={category.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <span className="text-xs font-semibold text-center line-clamp-2 text-foreground">
          {category.name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/menu?category=${category.id}`}
      className={cn(
        'food-card group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl bg-card p-6 shadow-card hover:shadow-card-hover aspect-[4/5] transition-all duration-300 hover:-translate-y-1',
        className
      )}
    >
      <img 
        src={category.image} 
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
      <div className="relative text-center">
        <h3 className="font-bold text-white text-xl mb-1">{category.name}</h3>
        <span className="text-sm text-white/90 font-medium">{category.itemCount || 0} items</span>
      </div>
    </Link>
  );
};
