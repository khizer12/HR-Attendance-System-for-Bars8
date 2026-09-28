export interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: Array<'super_admin' | 'sub_admin' | 'employee'>;
}

export const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: '◱',
    roles: ['super_admin', 'sub_admin', 'employee'],
  },
  {
    to: '/attendance',
    label: 'Attendance',
    icon: '◷',
    roles: ['super_admin', 'sub_admin', 'employee'],
  },
  {
    to: '/schedule',
    label: 'Schedule',
    icon: '▤',
    roles: ['super_admin', 'sub_admin', 'employee'],
  },
  {
    to: '/employees',
    label: 'Employees',
    icon: '☰',
    roles: ['super_admin', 'sub_admin'],
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: '◈',
    roles: ['super_admin', 'sub_admin'],
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: '⚙',
    roles: ['super_admin'],
  },
    {
    to: '/audit-log',
    label: 'Audit log',
    icon: '◱',
    roles: ['super_admin'],
  },
];

/**
 * Return nav items visible to a given role.
 * Order is preserved from the source array.
 */
export function getNavItemsForRole(
  role: 'super_admin' | 'sub_admin' | 'employee',
): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}