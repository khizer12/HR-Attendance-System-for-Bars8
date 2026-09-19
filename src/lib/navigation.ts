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
];