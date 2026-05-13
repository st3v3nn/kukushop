import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';
import { PwaInstallButton } from './PwaInstallButton';
import { playClickSound } from '@/lib/sound';

export const AppLayout = () => {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, [role="button"], input[type="checkbox"], input[type="radio"], [data-click-sound]');
      if (!interactive) return;
      playClickSound(interactive instanceof HTMLAnchorElement ? 'bright' : 'soft');
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className="min-h-[100svh] bg-background overflow-x-hidden">
      <PwaInstallButton />
      {/* Mobile Layout */}
      <div className="xl:hidden">
        <div className="mx-auto min-h-[100svh] w-full max-w-[42rem] pb-20 xl:pb-0">
          <Outlet />
          <BottomNav />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden xl:block">
        <DesktopNav>
          <Outlet />
        </DesktopNav>
      </div>
    </div>
  );
};
