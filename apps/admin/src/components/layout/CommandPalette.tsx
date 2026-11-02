'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  FolderTree,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import type { AdminSearchResponse } from '@jhatpat/shared';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Kbd } from '@/components/ui/Kbd';
import { apiFetch } from '@/lib/api-client';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // Global keyboard shortcut Cmd+K or Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      } else if (
        e.key === '/' &&
        !open &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const { data: results, isLoading } = useQuery<AdminSearchResponse>({
    queryKey: ['admin', 'search', debouncedQuery],
    queryFn: () => apiFetch(`/api/v1/admin/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length >= 2,
    staleTime: 10 * 1000,
  });

  const navigateTo = (url: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(url);
  };

  const hasResults =
    results &&
    (results.orders.length > 0 ||
      results.products.length > 0 ||
      results.customers.length > 0 ||
      results.categories.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-xl border border-border shadow-2xl bg-surface">
        <DialogTitle className="sr-only">Command Palette Search</DialogTitle>
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-fg shrink-0 mr-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search orders, products, customers..."
            className="border-0 focus-visible:ring-0 text-sm h-12 px-0 bg-transparent"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-muted-fg hover:text-foreground p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Kbd>ESC</Kbd>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-border text-xs">
          {/* Quick Actions (when query is empty) */}
          {!query && (
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider px-2 block mb-1">
                Quick Actions
              </span>
              <button
                onClick={() => navigateTo('/products/new')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-foreground text-left"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>Create New Product</span>
              </button>
              <button
                onClick={() => navigateTo('/coupons')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-foreground text-left"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>Create New Coupon Voucher</span>
              </button>
              <button
                onClick={() => navigateTo('/banners')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-foreground text-left"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>Add Promotional Billboard Banner</span>
              </button>
              <button
                onClick={() => navigateTo('/orders')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-foreground text-left"
              >
                <ShoppingCart className="h-3.5 w-3.5 text-muted-fg" />
                <span>View Live Order Queue</span>
              </button>
            </div>
          )}

          {/* Search results */}
          {debouncedQuery.length >= 2 && (
            <>
              {isLoading && (
                <div className="p-4 text-center text-muted-fg text-xs">Searching...</div>
              )}

              {!isLoading && !hasResults && (
                <div className="p-6 text-center text-muted-fg text-xs">
                  No matching orders, products, or customers found for &quot;{debouncedQuery}&quot;.
                </div>
              )}

              {/* Orders Group */}
              {results?.orders && results.orders.length > 0 && (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider px-2 block mb-1">
                    Orders
                  </span>
                  {results.orders.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.url)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShoppingCart className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="font-semibold text-foreground truncate">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-fg shrink-0">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Products Group */}
              {results?.products && results.products.length > 0 && (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider px-2 block mb-1">
                    Products
                  </span>
                  {results.products.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.url)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Package className="h-3.5 w-3.5 text-muted-fg shrink-0" />
                        <span className="font-semibold text-foreground truncate">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-fg shrink-0">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Customers Group */}
              {results?.customers && results.customers.length > 0 && (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider px-2 block mb-1">
                    Customers
                  </span>
                  {results.customers.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.url)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Users className="h-3.5 w-3.5 text-muted-fg shrink-0" />
                        <span className="font-semibold text-foreground truncate">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-fg shrink-0">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Categories Group */}
              {results?.categories && results.categories.length > 0 && (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider px-2 block mb-1">
                    Categories
                  </span>
                  {results.categories.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.url)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderTree className="h-3.5 w-3.5 text-muted-fg shrink-0" />
                        <span className="font-semibold text-foreground truncate">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-fg shrink-0">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

