'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  RotateCcw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminPaymentListItem, AdminPaymentListResponse } from '@jhatpat/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { formatINR } from '@/lib/format';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { admin } = useAdmin();
  const isStaff = admin?.role === 'staff';

  const [tab, setTab] = useState<'all' | 'online' | 'cod' | 'refund_due'>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refund dialog state
  const [refundTarget, setRefundTarget] = useState<AdminPaymentListItem | null>(null);
  const [refundAmountRupees, setRefundAmountRupees] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, error, refetch } = useQuery<AdminPaymentListResponse>({
    queryKey: ['admin', 'payments', { page, tab, q: debouncedSearch }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (tab !== 'all') params.set('tab', tab);
      if (debouncedSearch) params.set('q', debouncedSearch);
      return apiFetch(`/api/v1/admin/payments?${params.toString()}`);
    },
    staleTime: 20 * 1000,
  });

  const payments = data?.items || [];
  const summary = data?.summary || {
    collectedPaise: 0,
    codPendingPaise: 0,
    failedPaise: 0,
    refundedPaise: 0,
  };
  const tabCounts = data?.tabCounts || { all: 0, online: 0, cod: 0, refundDue: 0 };
  const meta = data?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

  // Mark COD paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (orderCode: string) => {
      return apiFetch(`/api/v1/admin/payments/${orderCode}/mark-paid`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      toast.success('Payment marked as paid');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update payment status');
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async ({ code, amountPaise }: { code: string; amountPaise?: number }) => {
      return apiFetch(`/api/v1/admin/payments/${code}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amountPaise }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      setRefundTarget(null);
      setRefundAmountRupees('');
      toast.success('Refund processed successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Refund failed');
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  };

  const openRefundDialog = (p: AdminPaymentListItem) => {
    setRefundTarget(p);
    const remaining = p.amountPaise - p.refundedPaise;
    setRefundAmountRupees((remaining / 100).toFixed(2));
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    const amountNum = parseFloat(refundAmountRupees);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    const amountPaise = Math.round(amountNum * 100);
    refundMutation.mutate({ code: refundTarget.orderCode, amountPaise });
  };

  const tabsConfig = [
    { key: 'all', label: 'All Payments', count: tabCounts.all },
    { key: 'online', label: 'Online', count: tabCounts.online },
    { key: 'cod', label: 'Cash on Delivery', count: tabCounts.cod },
    { key: 'refund_due', label: 'Refund Due', count: tabCounts.refundDue },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Monitor online and COD transactions, manage gateway settlements, and issue refunds."
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">Collected</span>
          <div className="text-xl font-bold tracking-tight text-success mt-1">
            {formatINR(summary.collectedPaise)}
          </div>
          <span className="text-[11px] text-muted-fg mt-0.5 block">Successfully captured</span>
        </Card>

        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">COD to Collect</span>
          <div className="text-xl font-bold tracking-tight text-warning mt-1">
            {formatINR(summary.codPendingPaise)}
          </div>
          <span className="text-[11px] text-muted-fg mt-0.5 block">Pending delivery</span>
        </Card>

        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">Failed</span>
          <div className="text-xl font-bold tracking-tight text-danger-fg mt-1">
            {formatINR(summary.failedPaise)}
          </div>
          <span className="text-[11px] text-muted-fg mt-0.5 block">Gateway dropped</span>
        </Card>

        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">Refunded</span>
          <div className="text-xl font-bold tracking-tight text-foreground mt-1">
            {formatINR(summary.refundedPaise)}
          </div>
          <span className="text-[11px] text-muted-fg mt-0.5 block">Returned to customers</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-1">
        {tabsConfig.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-fg hover:text-foreground hover:border-border'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-accent/10 text-accent font-semibold' : 'bg-surface-2 text-muted-fg'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order code, customer, payment ID..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load payments"
          description="An error occurred while fetching payment records."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payment records found"
          description={
            debouncedSearch || tab !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Payments will appear here once orders are placed.'
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted-fg border-b border-border">
                <tr>
                  <th className="p-3 font-medium">Order</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Method</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Gateway Payment ID</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => {
                  const isCodPending = p.method === 'cod' && p.paymentStatus === 'pending';
                  const canRefund =
                    p.paymentStatus === 'paid' &&
                    p.amountPaise > p.refundedPaise;

                  return (
                    <tr key={p.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-foreground">
                        <Link href={`/orders/${p.orderCode}`} className="hover:text-accent">
                          {p.orderCode}
                        </Link>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-foreground">{p.customerName}</div>
                        {p.customerMobile && (
                          <div className="text-[11px] text-muted-fg font-mono">+91 {p.customerMobile}</div>
                        )}
                      </td>

                      <td className="p-3 uppercase text-[11px] text-foreground font-medium">
                        {p.method}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{formatINR(p.amountPaise)}</div>
                        {p.refundedPaise > 0 && (
                          <div className="text-[10px] text-danger-fg">
                            Refunded: {formatINR(p.refundedPaise)}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <StatusPill
                          tone={
                            p.paymentStatus === 'paid'
                              ? 'success'
                              : p.paymentStatus === 'refunded'
                                ? 'neutral'
                                : p.paymentStatus === 'failed'
                                  ? 'danger'
                                  : 'warning'
                          }
                          label={p.paymentStatus}
                        />
                      </td>

                      <td className="p-3 font-mono text-[11px] text-muted-fg">
                        {p.razorpayPaymentId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]">{p.razorpayPaymentId}</span>
                            <button
                              onClick={() => handleCopy(p.razorpayPaymentId!)}
                              className="text-muted-fg hover:text-foreground"
                              title="Copy Payment ID"
                            >
                              {copiedId === p.razorpayPaymentId ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="italic text-muted-fg/60">—</span>
                        )}
                      </td>

                      <td className="p-3 text-muted-fg whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        {!isStaff && isCodPending && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markPaidMutation.mutate(p.orderCode)}
                            loading={markPaidMutation.isPending}
                            className="h-7 px-2.5 text-xs text-success border-success/30 hover:bg-success/10"
                          >
                            Mark COD Paid
                          </Button>
                        )}

                        {!isStaff && canRefund && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRefundDialog(p)}
                            className="h-7 px-2.5 text-xs text-danger-fg border-danger/30 hover:bg-danger/10"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Refund
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => {
              const isCodPending = p.method === 'cod' && p.paymentStatus === 'pending';
              const canRefund =
                p.paymentStatus === 'paid' &&
                p.amountPaise > p.refundedPaise;

              return (
                <Card key={p.id} className="p-3.5 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/orders/${p.orderCode}`} className="font-mono font-semibold text-foreground text-sm hover:text-accent">
                        {p.orderCode}
                      </Link>
                      <div className="text-xs text-muted-fg mt-0.5">{p.customerName}</div>
                    </div>
                    <StatusPill
                      tone={
                        p.paymentStatus === 'paid'
                          ? 'success'
                          : p.paymentStatus === 'refunded'
                            ? 'neutral'
                            : p.paymentStatus === 'failed'
                              ? 'danger'
                              : 'warning'
                      }
                      label={p.paymentStatus}
                    />
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-border text-xs">
                    <div>
                      <span className="text-muted-fg uppercase text-[10px] block">Method</span>
                      <span className="font-semibold text-foreground uppercase">{p.method}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-fg uppercase text-[10px] block">Amount</span>
                      <span className="font-semibold text-foreground">{formatINR(p.amountPaise)}</span>
                    </div>
                  </div>

                  {(!isStaff && (isCodPending || canRefund)) && (
                    <div className="pt-2 border-t border-border flex justify-end gap-2">
                      {isCodPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markPaidMutation.mutate(p.orderCode)}
                          loading={markPaidMutation.isPending}
                          className="h-7 px-3 text-xs text-success border-success/30"
                        >
                          Mark COD Paid
                        </Button>
                      )}
                      {canRefund && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRefundDialog(p)}
                          className="h-7 px-3 text-xs text-danger-fg border-danger/30"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Refund
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-2 text-xs text-muted-fg">
            <div>
              Showing {Math.min((page - 1) * meta.pageSize + 1, meta.total)} -{' '}
              {Math.min(page * meta.pageSize, meta.total)} of {meta.total} payments
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

      {/* Refund Dialog */}
      <Dialog open={refundTarget !== null} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Process a refund for order #{refundTarget?.orderCode}. This calls the payment gateway API directly.
            </DialogDescription>
          </DialogHeader>

          {refundTarget && (
            <form onSubmit={handleRefundSubmit} className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-fg">Order Total:</span>
                  <span className="font-semibold text-foreground">{formatINR(refundTarget.amountPaise)}</span>
                </div>
                {refundTarget.refundedPaise > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-fg">Already Refunded:</span>
                    <span className="text-danger-fg">{formatINR(refundTarget.refundedPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="font-medium text-foreground">Remaining Refundable:</span>
                  <span className="font-bold text-foreground">
                    {formatINR(refundTarget.amountPaise - refundTarget.refundedPaise)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Refund Amount (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(refundTarget.amountPaise - refundTarget.refundedPaise) / 100}
                  value={refundAmountRupees}
                  onChange={(e) => setRefundAmountRupees(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setRefundTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" loading={refundMutation.isPending}>
                  Confirm Refund
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

