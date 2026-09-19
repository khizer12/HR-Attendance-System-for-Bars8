import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Header } from '@/layouts/Header';
import { Sidebar } from '@/layouts/Sidebar';
import { cn } from '@/utils/cn';
import { navItems } from '@/lib/navigation';

function usePageTitle(): string {
  const { pathname } = useLocation();
  const match = navItems.find((item) => pathname.startsWith(item.to));
  return match?.label ?? 'Dashboard';
}

export function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = usePageTitle();
  const { pathname } = useLocation();
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-screen bg-near-black overflow-hidden">
      <aside className="hidden lg:flex shrink-0">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div
          role="presentation"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

            <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        inert={!mobileOpen}
      >
        <Sidebar onNavigate={closeMobile} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileNav={() => setMobileOpen(true)} title={title} />

                <main className="flex-1 overflow-y-auto bg-grid">
          <div key={pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}