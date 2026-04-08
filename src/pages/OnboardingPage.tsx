import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Utensils, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const slides = [
  {
    icon: Utensils,
    title: 'Delicious Meals',
    description: 'Explore our menu of crispy fried chicken, burgers, and more - all made fresh!',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
  },
  {
    icon: Clock,
    title: 'Fast Delivery',
    description: 'Get your favorite meals delivered hot and fresh to your doorstep in minutes.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  },
  {
    icon: MapPin,
    title: 'Track Your Order',
    description: 'Real-time tracking lets you know exactly when your food will arrive.',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80',
  },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('kuku_onboarded', 'true');
    navigate('/', { replace: true });
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Skip button */}
      <div className="flex justify-end p-4 safe-top">
        <button
          onClick={completeOnboarding}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
      </div>

      {/* Image */}
      <div className="relative flex-1 overflow-hidden">
        {slides.map((s, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 transition-all duration-500',
              index === currentSlide 
                ? 'opacity-100 translate-x-0' 
                : index < currentSlide 
                  ? 'opacity-0 -translate-x-full'
                  : 'opacity-0 translate-x-full'
            )}
          >
            <img
              src={s.image}
              alt={s.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 -mt-20 rounded-t-3xl bg-background px-6 pb-8 pt-6">
        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>

        {/* Text */}
        <h2 className="mb-2 text-2xl font-bold">{slide.title}</h2>
        <p className="mb-6 text-muted-foreground">{slide.description}</p>

        {/* Dots */}
        <div className="mb-6 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted-foreground/30'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Button */}
        <Button 
          onClick={handleNext}
          className="w-full h-14 text-base font-semibold gap-2"
          size="lg"
        >
          {isLastSlide ? 'Get Started' : 'Next'}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPage;
