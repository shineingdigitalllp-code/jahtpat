'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Search,
  ShoppingBag,
} from 'lucide-react';
import type { AdminCustomerListItem, AdminCustomerListResponse } from '@jhatpat/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { apiFetch } from '@/lib/api-client';
import { formatINR } from '@/lib/format';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, error, refetch } = useQuery<AdminCustomerListResponse>({
    queryKey: ['admin', 'customers', { page, q: debouncedSearch, blockedFilter, sort }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (blockedFilter === 'active') params.set('blocked', 'false');
      if (blockedFilter === 'blocked') params.set('blocked', 'true');
      if (sort) params.set('sort', sort);
      return apiFetch(`/api/v1/admin/customers?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });

  const customers = data?.items || [];
  const meta = data?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="View customer profiles, ordering history, wallet balances, and account status."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, email..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Filter */}
          <select
            value={blockedFilter}
            onChange={(e) => {
              setBlockedFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="recent">Recently Joined</option>
            <option value="orders">Most Orders</option>
            <option value="spend">Highest Lifetime Spend</option>
          </select>
        </div>
      </div>

      {/* Customers List Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load customers"
          description="An error occurred while fetching customer accounts."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description={
            debouncedSearch || blockedFilter !== 'all'
              ? 'Try adjusting your search query or filter.'
              : 'Registered customer accounts will appear here.'
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted-fg border-b border-border">
                <tr>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Contact</th>
                  <th className="p-3 font-medium">Orders</th>
                  <th className="p-3 font-medium">Lifetime Spend</th>
                  <th className="p-3 font-medium">Wallet</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-surface-2/50 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="p-3">
                        <Link
                          href={`/customers/${c.id}`}
                          className="flex items-center gap-3 group-hover:text-accent transition-colors"
                        >
                          <Avatar name={c.name} size="md" />
                          <div>
                            <span className="font-semibold text-foreground block">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-muted-fg">
                              Joined {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Contact */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          {c.mobile ? (
                            <div className="flex items-center gap-1.5 text-foreground font-mono">
                              <Phone className="h-3 w-3 text-muted-fg" />
                              <span>+91 {c.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-muted-fg italic">No mobile</span>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-muted-fg text-[11px]">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="p-3 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-fg" />
                          <span>{c.ordersCount}</span>
                        </div>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                        {formatINR(c.lifetimeSpendPaise)}
                      </td>

                      {/* Wallet Balance */}
                      <td className="p-3 whitespace-nowrap">
                        {c.walletPaise > 0 ? (
                          <span className="font-semibold text-accent">{formatINR(c.walletPaise)}</span>
                        ) : (
                          <span className="text-muted-fg">₹0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <StatusPill
                          tone={c.isBlocked ? 'danger' : 'success'}
                          label={c.isBlocked ? 'Blocked' : 'Active'}
                        />
                      </td>

                      {/* Action */}
                      <td className="p-3 text-right">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Rows */}
          <div className="md:hidden space-y-3">
            {customers.map((c) => {
              return (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <Card className="p-3.5 border border-border hover:border-accent/30 transition-colors space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="md" />
                        <div>
                          <span className="font-semibold text-foreground text-sm block">
                            {c.name}
                          </span>
                          <span className="text-xs text-muted-fg font-mono">
                            {c.mobile ? `+91 ${c.mobile}` : c.email || 'No contact'}
                          </span>
                        </div>
                      </div>

                      <StatusPill
                        tone={c.isBlocked ? 'danger' : 'success'}
                        label={c.isBlocked ? 'Blocked' : 'Active'}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center text-xs">
                      <div>
                        <span className="text-[10px] text-muted-fg block">Orders</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{c.ordersCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-fg block">Spend</span>
                        <span className="font-semibold text-foreground mt-0.5 block">{formatINR(c.lifetimeSpendPaise)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-fg block">Wallet</span>
                        <span className="font-semibold text-accent mt-0.5 block">{formatINR(c.walletPaise)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-2 text-xs text-muted-fg">
            <div>
              Showing {Math.min((page - 1) * meta.pageSize + 1, meta.total)} -{' '}
              {Math.min(page * meta.pageSize, meta.total)} of {meta.total} customers
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-medium text-foreground">
                {page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
