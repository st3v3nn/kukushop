import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  className?: string;
}

export const PromoBanner = ({ 
  title, 
  subtitle, 
  image, 
  link = '/menu',
  className 
}: PromoBannerProps) => {
  return (
    <Link 
      to={link}
      className={cn(
        'food-card relative flex overflow-hidden rounded-2xl bg-primary h-40',
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent" />
        <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-accent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center p-5">
        <h3 className="text-xl font-bold text-primary-foreground leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-primary-foreground/80">{subtitle}</p>
        )}
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
          Order Now
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
      
      {/* Image */}
      <div className="relative h-full w-2/5">
        <img 
          src={image} 
          alt={title}
          className="absolute right-0 top-1/2 h-36 w-36 -translate-y-1/2 translate-x-4 object-contain drop-shadow-xl"
        />
      </div>
    </Link>
  );
};

export const PromoCarousel = ({ promos }: { promos: PromoBannerProps[] }) => {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2 lg:overflow-visible lg:px-0 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-6">
      {promos.map((promo, index) => (
        <PromoBanner 
          key={index} 
          {...promo} 
          className="flex-shrink-0 w-[85vw] max-w-sm lg:flex-shrink lg:w-auto"
        />
      ))}
    </div>
  );
};
