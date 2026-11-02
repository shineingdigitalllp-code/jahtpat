'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Clock,
  Download,
  Filter,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
} from 'lucide-react';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  nextStatusAction,
  type OrderListResponse,
} from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { formatDateIST, formatINR, formatRelativeTime, formatTimeIST } from '@/lib/format';
import { useAdmin } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { admin } = useAdmin();

  // Search and filter state synced with query params
  const [statusTab, setStatusTab] = React.useState<string>(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = React.useState<string>(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>(searchQuery);
  const [paymentStatus, setPaymentStatus] = React.useState<string>(searchParams.get('paymentStatus') || 'all');
  const [paymentMethod, setPaymentMethod] = React.useState<string>(searchParams.get('method') || 'all');
  const [page, setPage] = React.useState<number>(Number(searchParams.get('page') || 1));

  // Newly arrived orders highlighting tracker
  const [highlightedCodes, setHighlightedCodes] = React.useState<Set<string>>(new Set());
  const prevOrderCodesRef = React.useRef<Set<string>>(new Set());

  // Debounce search query 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearInterval(timer);
  }, [searchQuery]);

  const queryParams = new URLSearchParams();
  if (statusTab !== 'all') queryParams.set('status', statusTab);
  if (debouncedQuery.trim()) queryParams.set('q', debouncedQuery.trim());
  if (paymentStatus !== 'all') queryParams.set('paymentStatus', paymentStatus);
  if (paymentMethod !== 'all') queryParams.set('method', paymentMethod);
  queryParams.set('page', String(page));
  queryParams.set('pageSize', '20');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<OrderListResponse>({
    queryKey: ['admin', 'orders', queryParams.toString()],
    queryFn: () => apiFetch<OrderListResponse>(`/api/v1/admin/orders?${queryParams.toString()}`),
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
  });

  // Track newly arrived orders for soft highlight
  React.useEffect(() => {
    if (data?.items && prevOrderCodesRef.current.size > 0) {
      const newCodes = new Set<string>();
      for (const order of data.items) {
        if (!prevOrderCodesRef.current.has(order.code)) {
          newCodes.add(order.code);
        }
      }
      if (newCodes.size > 0) {
        setHighlightedCodes(newCodes);
        const timer = setTimeout(() => {
          setHighlightedCodes(new Set());
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
    if (data?.items) {
      prevOrderCodesRef.current = new Set(data.items.map((o) => o.code));
    }
  }, [data]);

  const statusActionMutation = useMutation({
    mutationFn: async ({ code, nextStatus }: { code: string; nextStatus: string }) => {
      return apiFetch(`/api/v1/admin/orders/${code}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Order ${vars.code} updated`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        toast.error('Order was updated by someone else, refreshing...');
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      } else {
        toast.error(err.message || 'Failed to update order status');
      }
    },
  });

  const handleExportCsv = async () => {
    try {
      const exportParams = new URLSearchParams();
      if (statusTab !== 'all') exportParams.set('status', statusTab);
      if (debouncedQuery.trim()) exportParams.set('q', debouncedQuery.trim());
      if (paymentStatus !== 'all') exportParams.set('paymentStatus', paymentStatus);
      if (paymentMethod !== 'all') exportParams.set('method', paymentMethod);

      const url = `/api/v1/admin/orders/export.csv?${exportParams.toString()}`;
      window.location.href = url;
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const tabs = [
    { key: 'all', label: 'All Orders', count: data?.statusCounts['all'] ?? 0 },
    { key: 'placed', label: 'New', count: data?.statusCounts['placed'] ?? 0, tone: 'info' },
    { key: 'preparing', label: 'Preparing', count: data?.statusCounts['preparing'] ?? 0, tone: 'warning' },
    { key: 'out_for_delivery', label: 'Out for Delivery', count: data?.statusCounts['out_for_delivery'] ?? 0, tone: 'indigo' },
    { key: 'delivered', label: 'Delivered', count: data?.statusCounts['delivered'] ?? 0, tone: 'success' },
    { key: 'cancelled', label: 'Cancelled', count: data?.statusCounts['cancelled'] ?? 0, tone: 'danger' },
  ];

  const canExport = admin?.role === 'owner' || admin?.role === 'manager';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Fulfill, track, and manage customer grocery deliveries."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              loading={isRefetching}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>

            {canExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCsv}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 1. Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border select-none">
        {tabs.map((tab) => {
          const isActive = statusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusTab(tab.key);
                setPage(1);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-[8px] transition-colors whitespace-nowrap cursor-pointer border-b-2 -mb-[1px]',
                isActive
                  ? 'border-accent text-accent bg-surface font-semibold'
                  : 'border-transparent text-muted hover:text-ink hover:bg-surface-2',
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-semibold',
                    tab.tone === 'info' && 'bg-[var(--tone-info-bg)] text-[var(--tone-info-text)]',
                    tab.tone === 'warning' && 'bg-[var(--tone-warning-bg)] text-[var(--tone-warning-text)]',
                    tab.tone === 'indigo' && 'bg-[var(--tone-indigo-bg)] text-[var(--tone-indigo-text)]',
                    tab.tone === 'success' && 'bg-[var(--tone-success-bg)] text-[var(--tone-success-text)]',
                    tab.tone === 'danger' && 'bg-[var(--tone-danger-bg)] text-[var(--tone-danger-text)]',
                    !tab.tone && 'bg-surface-2 text-muted',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-[12px] border border-border">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, customer, mobile..."
            className="pl-8 h-8 text-xs bg-surface-2"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Payment Status Filter */}
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-[8px] border border-border bg-surface-2 px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Payment Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="h-8 rounded-[8px] border border-border bg-surface-2 px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="cod">Cash on Delivery</option>
            <option value="online">Online / UPI</option>
          </select>
        </div>
      </div>

      {/* 3. Orders Content (Table & Mobile Cards) */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full rounded-[6px]" />
            <Skeleton className="h-12 w-full rounded-[6px]" />
            <Skeleton className="h-12 w-full rounded-[6px]" />
            <Skeleton className="h-12 w-full rounded-[6px]" />
            <Skeleton className="h-12 w-full rounded-[6px]" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-10 w-10 stroke-[1.5]" />}
            title="No orders found"
            description="No orders match the selected filters or search criteria."
            action={
              (debouncedQuery || statusTab !== 'all' || paymentStatus !== 'all' || paymentMethod !== 'all') ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusTab('all');
                    setSearchQuery('');
                    setPaymentStatus('all');
                    setPaymentMethod('all');
                    setPage(1);
                  }}
                >
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 border-b border-border text-muted font-medium select-none">
                  <tr>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4">Placed At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((order) => {
                    const statusMeta = ORDER_STATUS_META[order.status] || {
                      label: order.status,
                      tone: 'neutral' as const,
                    };
                    const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus] || {
                      label: order.paymentStatus,
                      tone: 'neutral' as const,
                    };

                    const nextAction = nextStatusAction(order.status);
                    const isHighlighted = highlightedCodes.has(order.code);

                    return (
                      <tr
                        key={order.code}
                        className={cn(
                          'hover:bg-surface-2/60 transition-colors group',
                          isHighlighted && 'bg-accent-soft transition-all duration-1000',
                        )}
                      >
                        {/* Order Code & Relative Time */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/orders/${order.code}`}
                            className="font-mono font-semibold text-ink group-hover:text-accent transition-colors hover:underline block"
                          >
                            {order.code}
                          </Link>
                          <span className="text-[11px] text-muted tabular-nums">
                            {formatRelativeTime(order.createdAt)}
                          </span>
                        </td>

                        {/* Customer Info */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-ink truncate max-w-[140px]">
                            {order.customerName}
                          </div>
                          {order.customerMobile && (
                            <a
                              href={`tel:${order.customerMobile}`}
                              className="text-[11px] text-muted hover:text-accent flex items-center gap-1 tabular-nums mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              <span>{order.customerMobile}</span>
                            </a>
                          )}
                        </td>

                        {/* Item count */}
                        <td className="py-3 px-3 text-muted tabular-nums">
                          {order.itemCount} items
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 font-semibold text-ink tabular-nums">
                          {formatINR(order.totalPaise)}
                        </td>

                        {/* Payment Info */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <StatusPill tone={paymentMeta.tone} label={paymentMeta.label} />
                            <div className="text-[10px] text-muted uppercase">
                              {order.paymentMethod}
                            </div>
                          </div>
                        </td>

                        {/* Order Status */}
                        <td className="py-3 px-3">
                          <StatusPill tone={statusMeta.tone} label={statusMeta.label} />
                        </td>

                        {/* Placed Time (IST) */}
                        <td className="py-3 px-4 text-muted tabular-nums">
                          <div>{formatDateIST(order.createdAt)}</div>
                          <div className="text-[10px]">{formatTimeIST(order.createdAt)}</div>
                        </td>

                        {/* Primary Next Action */}
                        <td className="py-3 px-4 text-right">
                          {nextAction && order.status !== 'preparing' ? (
                            <Button
                              size="sm"
                              variant="primary"
                              loading={
                                statusActionMutation.isPending &&
                                statusActionMutation.variables?.code === order.code
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                statusActionMutation.mutate({
                                  code: order.code,
                                  nextStatus: nextAction.status,
                                });
                              }}
                              className="h-7 px-2.5 text-xs"
                            >
                              {nextAction.label}
                            </Button>
                          ) : (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-xs font-medium border-border hover:bg-surface-2 text-foreground"
                            >
                              <Link href={`/orders/${order.code}`}>View</Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Rows (< 768px) */}
            <div className="md:hidden divide-y divide-border">
              {data.items.map((order) => {
                const statusMeta = ORDER_STATUS_META[order.status] || {
                  label: order.status,
                  tone: 'neutral' as const,
                };
                const nextAction = nextStatusAction(order.status);

                return (
                  <Link
                    key={order.code}
                    href={`/orders/${order.code}`}
                    className="p-4 block hover:bg-surface-2 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {order.code}
                        </span>
                        <span className="text-[11px] text-muted tabular-nums">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                      </div>
                      <StatusPill tone={statusMeta.tone} label={statusMeta.label} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-ink">{order.customerName}</div>
                        <div className="text-[11px] text-muted tabular-nums">
                          {order.itemCount} items · {order.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-ink tabular-nums">
                          {formatINR(order.totalPaise)}
                        </div>
                      </div>
                    </div>

                    {nextAction && order.status !== 'preparing' && (
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            statusActionMutation.mutate({
                              code: order.code,
                              nextStatus: nextAction.status,
                            });
                          }}
                          className="w-full h-8 text-xs font-medium"
                        >
                          {nextAction.label}
                        </Button>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-3 sm:px-4 border-t border-border text-xs text-muted">
                <div>
                  Showing page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} orders)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.meta.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.meta.page >= data.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-7 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

