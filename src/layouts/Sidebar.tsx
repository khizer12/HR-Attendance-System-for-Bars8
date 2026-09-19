import { NavLink } from 'react-router-dom';

import { cn } from '@/utils/cn';
import { getNavItemsForRole } from '@/lib/navigation';
import { useAuth } from '@/features/auth';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { profile } = useAuth();
  const items = profile ? getNavItemsForRole(profile.role) : [];

  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-64 flex-col bg-charcoal border-r border-charcoal-3"
    >
      <div className="h-16 flex items-center px-5 border-b border-charcoal-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-lime flex items-center justify-center">
            <span className="font-heading font-bold text-near-black text-sm">
              HR
            </span>
          </div>
          <div className="leading-tight">
            <div className="font-heading font-semibold text-sm">Attendance</div>
            <div className="text-[10px] text-muted-gray uppercase tracking-wider">
              Management
            </div>
          </div>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
                className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                  'transition-all duration-150 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal',
                  isActive
                    ? 'bg-charcoal-3 text-off-white font-medium'
                    : 'text-muted-gray hover:text-off-white hover:bg-charcoal-2 hover:translate-x-0.5',
                )
              }
            >
                <span
                aria-hidden="true"
                className="w-4 text-center text-base transition-transform duration-150 group-hover:scale-110"
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-3 border-t border-charcoal-3">
        <div className="text-[10px] text-muted-gray text-center">
          v0.1.0 — Phase 3
        </div>
      </div>
    </nav>
  );
}