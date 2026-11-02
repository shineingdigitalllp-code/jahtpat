'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Laptop,
  User,
} from 'lucide-react';
import type { AdminCounts } from '@jhatpat/shared';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/lib/nav';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { useUIStore } from '@/store/ui-store';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [storeOpen, setStoreOpen] = React.useState(true);

  // Global keyboard shortcut (Cmd+B / Ctrl+B) to toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const { data: counts } = useQuery<AdminCounts>({
    queryKey: ['admin', 'counts'],
    queryFn: () => apiFetch<AdminCounts>('/api/v1/admin/counts'),
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
    enabled: !!admin,
  });

  const canToggleStore = admin?.role === 'owner' || admin?.role === 'manager';

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-sidebar backdrop-blur-xl transition-all duration-200 select-none shrink-0 h-screen sticky top-0 z-40',
          sidebarCollapsed ? 'w-[64px]' : 'w-[248px]',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'h-14 flex items-center border-b border-border shrink-0 transition-all',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5',
          )}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-[19px] font-extrabold text-accent leading-none tracking-tight">
                  jhatpat
                </span>
                <span className="rounded-md bg-neutral-950 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white dark:bg-surface-2 dark:text-muted shadow-2xs">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="h-8 w-8 rounded-[8px] border border-border bg-white dark:bg-surface-2/60 hover:bg-neutral-100 dark:hover:bg-surface hover:border-border-strong flex items-center justify-center text-muted hover:text-ink transition-all cursor-pointer shadow-2xs"
                title="Collapse sidebar (⌘B)"
                aria-label="Collapse sidebar (⌘B)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Tooltip content="Expand sidebar (⌘B)" side="right">
              <button
                type="button"
                onClick={toggleSidebar}
                className="h-8 w-8 rounded-[8px] border border-border bg-white dark:bg-surface-2/60 hover:bg-neutral-100 dark:hover:bg-surface hover:border-border-strong flex items-center justify-center text-muted hover:text-ink transition-all cursor-pointer shadow-2xs"
                title="Expand sidebar (⌘B)"
                aria-label="Expand sidebar (⌘B)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => item.enabled && admin && item.roles.includes(admin.role),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {group.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const count = item.countKey && counts ? counts[item.countKey] : 0;

                    const linkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 h-8.5 rounded-[8px] px-2.5 text-[13px] font-medium transition-all relative',
                          isActive
                            ? 'bg-neutral-950 text-white font-semibold shadow-xs dark:bg-accent-soft dark:text-accent'
                            : 'text-ink-2 hover:bg-neutral-200/60 hover:text-ink dark:hover:bg-surface-2 dark:hover:text-ink',
                          sidebarCollapsed && 'justify-center px-0',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-accent dark:text-accent' : 'text-muted')} />
                        {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {!sidebarCollapsed && count > 0 && (
                          <Badge variant={item.countKey === 'newOrders' ? 'info' : 'neutral'}>
                            {count}
                          </Badge>
                        )}
                        {sidebarCollapsed && count > 0 && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--tone-info-text)]" />
                        )}
                      </Link>
                    );

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.href} content={item.label} side="right">
                          {linkContent}
                        </Tooltip>
                      );
                    }

                    return linkContent;
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-2">
          {/* Store status switch */}
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-neutral-950 text-white dark:bg-surface-2 dark:text-ink text-xs shadow-xs border border-neutral-900 dark:border-border">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    storeOpen ? 'bg-emerald-400 ring-2 ring-emerald-400/25' : 'bg-neutral-500',
                  )}
                />
                <span className="font-semibold text-xs text-white dark:text-ink">
                  {storeOpen ? 'Store open' : 'Store closed'}
                </span>
              </div>
              <Switch
                checked={storeOpen}
                onCheckedChange={setStoreOpen}
                disabled={!canToggleStore}
                aria-label="Toggle store open/closed"
              />
            </div>
          ) : (
            <Tooltip content={storeOpen ? 'Store open' : 'Store closed'} side="right">
              <div className="flex justify-center p-1.5 rounded-[8px] bg-neutral-950 dark:bg-surface-2 border border-neutral-900 dark:border-border">
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    storeOpen ? 'bg-emerald-400 ring-2 ring-emerald-400/25' : 'bg-neutral-500',
                  )}
                />
              </div>
            </Tooltip>
          )}

          {/* User profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-2.5 p-1.5 rounded-[8px] bg-white dark:bg-transparent hover:bg-neutral-100 dark:hover:bg-surface-2 border border-border/80 dark:border-transparent transition-all cursor-pointer text-left shadow-2xs dark:shadow-none',
                  sidebarCollapsed && 'justify-center',
                )}
              >
                <Avatar name={admin?.name} size="sm" />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-ink truncate leading-tight">
                      {admin?.name}
                    </div>
                    <div className="text-[11px] font-semibold text-muted capitalize truncate leading-tight">
                      {admin?.role}
                    </div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={sidebarCollapsed ? 'right' : 'top'} align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
      </aside>
    </TooltipProvider>
  );
}

