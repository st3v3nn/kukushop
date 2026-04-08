import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="xl:hidden">
        <div className="pb-20 xl:pb-0">
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
