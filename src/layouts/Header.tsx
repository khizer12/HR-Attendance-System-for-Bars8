import { useState } from 'react';

import { cn } from '@/utils/cn';
import { useAuth } from '@/features/auth';

interface HeaderProps {
  onOpenMobileNav?: () => void;
  title?: string;
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email;
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Header({ onOpenMobileNav, title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = profile
    ? getInitials(profile.full_name, profile.email)
    : '?';

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-charcoal border-b border-charcoal-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-off-white hover:bg-charcoal-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ☰
          </span>
        </button>

        <h1 className="font-heading text-base font-semibold">
          {title ?? 'Dashboard'}
        </h1>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Open user menu"
                    className="h-9 w-9 rounded-full bg-charcoal-3 flex items-center justify-center text-xs font-medium text-off-white hover:bg-charcoal-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime transition-all duration-150 active:scale-95"
        >
          {initials}
        </button>

        {menuOpen && (
          <>
            {/* Click-outside overlay */}
            <div
              role="presentation"
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
            />
                        <div
              role="menu"
              className={cn(
                'absolute right-0 top-full mt-2 z-40 w-56 rounded-lg bg-charcoal-2 border border-charcoal-3 shadow-lg overflow-hidden',
                'animate-dropdown-in origin-top-right',
              )}
            >
              {profile && (
                <div className="px-3 py-3 border-b border-charcoal-3">
                  <div className="text-sm font-medium text-off-white truncate">
                    {profile.full_name || 'Unnamed user'}
                  </div>
                  <div className="text-xs text-muted-gray truncate">
                    {profile.email}
                  </div>
                  <div className="text-[10px] text-muted-gray uppercase tracking-wider mt-1">
                    {profile.role.replace('_', ' ')}
                  </div>
                </div>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                className="w-full text-left px-3 py-2.5 text-sm text-off-white hover:bg-charcoal-3 transition-colors focus-visible:outline-none focus-visible:bg-charcoal-3"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}