import type { AdminRole } from '@jhatpat/shared';
import {
  BarChart3,
  CreditCard,
  FolderTree,
  History,
  Image,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: AdminRole[];
  enabled: boolean;
  countKey?: 'newOrders' | 'lowStock' | 'pendingAdmins';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['owner', 'manager', 'staff'],
        enabled: true,
      },
    ],
  },
  {
    title: 'Sales',
    items: [
      {
        label: 'Orders',
        href: '/orders',
        icon: ShoppingCart,
        roles: ['owner', 'manager', 'staff'],
        enabled: true,
        countKey: 'newOrders',
      },
      {
        label: 'Payments',
        href: '/payments',
        icon: CreditCard,
        roles: ['owner', 'manager'],
        enabled: true,
      },
      {
        label: 'Customers',
        href: '/customers',
        icon: Users,
        roles: ['owner', 'manager', 'staff'],
        enabled: true,
      },
    ],
  },
  {
    title: 'Catalog',
    items: [
      {
        label: 'Products',
        href: '/products',
        icon: Package,
        roles: ['owner', 'manager', 'staff'],
        enabled: true,
        countKey: 'lowStock',
      },
      {
        label: 'Categories',
        href: '/categories',
        icon: FolderTree,
        roles: ['owner', 'manager'],
        enabled: true,
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      {
        label: 'Coupons',
        href: '/coupons',
        icon: Tag,
        roles: ['owner', 'manager'],
        enabled: true,
      },
      {
        label: 'Banners',
        href: '/banners',
        icon: Image,
        roles: ['owner', 'manager'],
        enabled: true,
      },
    ],
  },
  {
    title: 'Insights',
    items: [
      {
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        roles: ['owner', 'manager'],
        enabled: true,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Team',
        href: '/team',
        icon: ShieldCheck,
        roles: ['owner'],
        enabled: true,
        countKey: 'pendingAdmins',
      },
      {
        label: 'Activity',
        href: '/activity',
        icon: History,
        roles: ['owner', 'manager'],
        enabled: true,
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['owner'],
        enabled: true,
      },
    ],
  },
];

