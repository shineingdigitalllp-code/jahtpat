'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  CreditCard,
  FolderTree,
  History,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Tag,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/lib/auth-context';
import { NAV_GROUPS } from '@/lib/nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { Switch } from '@/components/ui/Switch';

export function MobileTabBar() {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  const { theme, setTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const mainTabs = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', href: '/orders', icon: ShoppingCart },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Customers', href: '/customers', icon: Users },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] select-none"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[10px] transition-colors',
                isActive ? 'text-accent font-bold' : 'text-muted font-medium hover:text-ink',
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* More Tab */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-muted hover:text-ink transition-colors cursor-pointer',
                sheetOpen && 'text-accent',
              )}
            >
              <Menu className="h-5 w-5 mb-0.5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-4 max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar name={admin?.name} size="md" />
                <div className="min-w-0 text-left">
                  <SheetTitle className="text-sm font-semibold truncate">{admin?.name}</SheetTitle>
                  <p className="text-xs text-muted truncate capitalize">{admin?.role} · {admin?.email}</p>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-4 py-2">
              {/* Account Link */}
              <Link
                href="/account"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-[8px] hover:bg-surface-2 text-xs font-medium text-ink"
              >
                <User className="h-4 w-4 text-muted" />
                <span>Account settings</span>
              </Link>

              {/* Grouped Links */}
              {NAV_GROUPS.map((group) => {
                const visibleItems = group.items.filter(
                  (item) => item.enabled && admin && item.roles.includes(admin.role),
                );
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-1">
                    <div className="px-3 text-[11px] font-semibold uppercase text-muted tracking-wider">
                      {group.title}
                    </div>
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-[8px] text-xs font-medium transition-colors',
                            isActive ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-surface-2',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

              {/* Appearance */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="px-3 text-[11px] font-semibold uppercase text-muted tracking-wider">
                  Appearance
                </div>
                <div className="flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-surface-2 text-xs">
                  <span className="text-ink">Dark theme</span>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    aria-label="Toggle dark mode"
                  />
                </div>
              </div>

              {/* Sign out */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSheetOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-[8px] text-xs font-medium text-[var(--tone-danger-text)] hover:bg-[var(--tone-danger-bg)] transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

