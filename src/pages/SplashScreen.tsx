import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';

export const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-foreground">
      {/* Logo */}
      <div className="mb-4 animate-bounce-in">
        <Logo size="xl" className="drop-shadow-2xl" />
      </div>
      
      {/* Tagline */}
      <p className="mb-8 text-lg font-semibold text-primary animate-fade-in">
        Think Kuku! Think Sisi.
      </p>
      
      {/* Loading indicator */}
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted/20">
          <div 
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">Loading deliciousness...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
