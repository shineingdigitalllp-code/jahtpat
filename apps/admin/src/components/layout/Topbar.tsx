'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Bell, Laptop, LogOut, Moon, Search, Sun, User } from 'lucide-react';
import type { AdminCounts } from '@jhatpat/shared';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';
import { playOrderChime } from '@/lib/sound';
import { useAdmin } from '@/lib/auth-context';
import { useUIStore } from '@/store/ui-store';
import { Avatar } from '@/components/ui/Avatar';
import { Kbd } from '@/components/ui/Kbd';
import { CommandPalette } from '@/components/layout/CommandPalette';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export function Topbar() {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  const { theme, setTheme } = useTheme();
  const { soundEnabled } = useUIStore();
  const [commandOpen, setCommandOpen] = React.useState(false);

  const prevNewOrdersRef = React.useRef<number | undefined>(undefined);

  const { data: counts } = useQuery<AdminCounts>({
    queryKey: ['admin', 'counts'],
    queryFn: () => apiFetch<AdminCounts>('/api/v1/admin/counts'),
    staleTime: 20 * 1000,
    refetchInterval: 20 * 1000,
    enabled: !!admin,
  });

  const newOrders = counts?.newOrders ?? 0;

  // New order chime and alert handling
  React.useEffect(() => {
    if (prevNewOrdersRef.current !== undefined && newOrders > prevNewOrdersRef.current) {
      if (soundEnabled) {
        playOrderChime();
      }
      toast.info('New order waiting for fulfillment', {
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/orders?status=placed';
          },
        },
      });
    }
    prevNewOrdersRef.current = newOrders;
  }, [newOrders, soundEnabled]);

  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/account') return 'Account Settings';
    if (path.startsWith('/orders')) return 'Orders';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/coupons')) return 'Coupons';
    if (path.startsWith('/banners')) return 'Banners';
    if (path.startsWith('/analytics')) return 'Analytics';
    if (path.startsWith('/team')) return 'Team';
    if (path.startsWith('/activity')) return 'Activity';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Admin';
  };

  // Sync document title with active new orders count
  React.useEffect(() => {
    const title = getPageTitle(pathname);
    if (newOrders > 0) {
      document.title = `(${newOrders}) ${title} | Jhatpat Admin`;
    } else {
      document.title = `${title} | Jhatpat Admin`;
    }
  }, [newOrders, pathname]);

  const notificationCount = (counts?.newOrders ?? 0) + (counts?.pendingAdmins ?? 0);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-canvas/90 backdrop-blur-md px-4 sm:px-6 select-none">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm sm:text-base text-ink tracking-tight">
          {getPageTitle(pathname)}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger (Cmd+K) */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-2 h-8.5 w-52 rounded-[8px] border border-border/80 bg-white dark:bg-surface px-2.5 text-xs text-muted hover:border-border-strong hover:text-ink transition-all cursor-pointer shadow-2xs"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
          <span className="flex-1 text-left truncate font-medium">Search...</span>
          <Kbd>⌘K</Kbd>
        </button>

        {/* Mobile search icon */}
        <button
          type="button"
          className="flex sm:hidden h-8 w-8 items-center justify-center rounded-[8px] text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          aria-label="Search"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-4 w-4" />
        </button>

        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center rounded-[8px] text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--tone-info-text)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--tone-info-text)]" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            {notificationCount === 0 ? (
              <div className="p-3 text-xs text-muted text-center">No new notifications</div>
            ) : (
              <div className="space-y-1 p-1">
                {(counts?.newOrders ?? 0) > 0 && (
                  <Link
                    href="/orders?status=placed"
                    className="flex items-center justify-between p-2 rounded-[6px] bg-surface-2 hover:bg-surface transition-colors text-xs"
                  >
                    <span className="text-ink">New orders waiting</span>
                    <span className="font-semibold text-accent">{counts?.newOrders}</span>
                  </Link>
                )}
                {(counts?.pendingAdmins ?? 0) > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-[6px] bg-surface-2 text-xs">
                    <span className="text-ink">Pending staff approvals</span>
                    <span className="font-semibold text-[var(--tone-warning-text)]">
                      {counts?.pendingAdmins}
                    </span>
                  </div>
                )}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User avatar menu (Top right) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <Avatar name={admin?.name} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2.5 py-2">
              <div className="text-xs font-semibold text-ink leading-tight">{admin?.name}</div>
              <div className="text-[11px] text-muted truncate">{admin?.email}</div>
              <div className="mt-1 inline-block rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent capitalize">
                {admin?.role}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account" className="flex items-center gap-2 w-full">
                <User className="h-4 w-4 text-muted" />
                <span>Account settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-2 text-muted" />
              <span>Light</span>
              {theme === 'light' && <span className="ml-auto text-accent text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-2 text-muted" />
              <span>Dark</span>
              {theme === 'dark' && <span className="ml-auto text-accent text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Laptop className="h-4 w-4 mr-2 text-muted" />
              <span>System</span>
              {theme === 'system' && <span className="ml-auto text-accent text-xs">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} danger>
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
