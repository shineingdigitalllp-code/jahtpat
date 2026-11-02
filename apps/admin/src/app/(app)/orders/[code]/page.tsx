'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MoreVertical,
  Package,
  Phone,
  Printer,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  nextStatusAction,
  type OrderDetailResponse,
} from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { formatDateTimeIST, formatINR, formatTimeIST } from '@/lib/format';
import { useAdmin } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { admin } = useAdmin();

  // Dialogs & edit states
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('Customer requested cancellation');
  const [cancelNote, setCancelNote] = React.useState('');

  const [isEditingDelivery, setIsEditingDelivery] = React.useState(false);
  const [riderName, setRiderName] = React.useState('');
  const [riderPhone, setRiderPhone] = React.useState('');

  const [internalNote, setInternalNote] = React.useState('');
  const [isSavingNote, setIsSavingNote] = React.useState(false);

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery<OrderDetailResponse>({
    queryKey: ['admin', 'order', code],
    queryFn: () => apiFetch<OrderDetailResponse>(`/api/v1/admin/orders/${code}`),
    staleTime: 10 * 1000,
  });

  // Sync edit form states when order loads
  React.useEffect(() => {
    if (order) {
      setRiderName(order.riderName || '');
      setRiderPhone(order.riderPhone || '');
      setInternalNote(order.adminNote || '');
    }
  }, [order]);

  // Status transition mutation
  const statusMutation = useMutation({
    mutationFn: async ({ nextStatus, reason }: { nextStatus: string; reason?: string }) => {
      return apiFetch(`/api/v1/admin/orders/${code}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          reason,
          riderName: order?.riderName || riderName,
          riderPhone: order?.riderPhone || riderPhone,
        }),
      });
    },
    onSuccess: (_, vars) => {
      toast.success(`Order marked as ${vars.nextStatus}`);
      setCancelDialogOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        toast.error('Order was updated by someone else, refreshing...');
        refetch();
      } else {
        toast.error(err.message || 'Status update failed');
      }
    },
  });

  // Delivery update mutation
  const deliveryMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/v1/admin/orders/${code}/delivery`, {
        method: 'PATCH',
        body: JSON.stringify({ riderName, riderPhone }),
      });
    },
    onSuccess: () => {
      toast.success('Rider details updated');
      setIsEditingDelivery(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update rider details');
    },
  });

  // Autosave internal note
  const handleNoteBlur = async () => {
    if (order && internalNote !== (order.adminNote || '')) {
      setIsSavingNote(true);
      try {
        await apiFetch(`/api/v1/admin/orders/${code}/note`, {
          method: 'PATCH',
          body: JSON.stringify({ note: internalNote }),
        });
        toast.success('Internal note saved');
      } catch {
        toast.error('Failed to save internal note');
      } finally {
        setIsSavingNote(false);
      }
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading || !order) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-[8px]" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-44 rounded-[12px]" />
            <Skeleton className="h-64 rounded-[12px]" />
            <Skeleton className="h-40 rounded-[12px]" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-36 rounded-[12px]" />
            <Skeleton className="h-40 rounded-[12px]" />
            <Skeleton className="h-36 rounded-[12px]" />
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = ORDER_STATUS_META[order.status] || {
    label: order.status,
    tone: 'neutral' as const,
  };
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus] || {
    label: order.paymentStatus,
    tone: 'neutral' as const,
  };
  const nextAction = nextStatusAction(order.status);
  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  const fullAddressString = `${order.address.line1}${
    order.address.line2 ? `, ${order.address.line2}` : ''
  }, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddressString,
  )}`;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="h-8 w-8 shrink-0">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {order.code}
              </h1>
              <StatusPill tone={statusMeta.tone} label={statusMeta.label} />
            </div>
            <p className="text-xs text-muted mt-0.5">
              Placed {formatDateTimeIST(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {nextAction && !isTerminal && (
            <Button
              size="sm"
              variant="primary"
              loading={statusMutation.isPending}
              onClick={() => {
                if (nextAction.status === 'out_for_delivery' && (!order.riderName || !order.riderPhone)) {
                  setIsEditingDelivery(true);
                  toast.error('Please assign rider name and phone first');
                  return;
                }
                statusMutation.mutate({ nextStatus: nextAction.status });
              }}
              className="px-4 text-xs font-semibold gap-1.5"
            >
              <span>{nextAction.label}</span>
            </Button>
          )}

          {/* Overflow Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.code}/print`} target="_blank" className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-muted" />
                  <span>Print packing slip</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(window.location.href, 'Order link')}>
                <Copy className="h-4 w-4 mr-2 text-muted" />
                <span>Copy link</span>
              </DropdownMenuItem>
              {!isTerminal && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCancelDialogOpen(true)} danger>
                    <XCircle className="h-4 w-4 mr-2" />
                    <span>Cancel order</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 columns): Timeline, Items, Price Summary */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Timeline Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-ink">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {order.timeline.map((step) => {
                  return (
                    <div key={step.key} className="relative flex items-start gap-3 text-xs">
                      <div
                        className={cn(
                          'absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface border',
                          step.completed
                            ? 'border-accent text-accent'
                            : 'border-border text-muted',
                          step.key === 'cancelled' && 'border-[var(--tone-danger-text)] text-[var(--tone-danger-text)]',
                        )}
                      >
                        {step.key === 'cancelled' ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : step.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'font-semibold',
                              step.completed ? 'text-ink' : 'text-muted',
                              step.key === 'cancelled' && 'text-[var(--tone-danger-text)]',
                            )}
                          >
                            {step.label}
                          </span>
                          {step.time && (
                            <span className="text-[11px] text-muted tabular-nums">
                              {formatTimeIST(step.time)}
                            </span>
                          )}
                        </div>

                        {step.elapsedMinutes !== null && step.elapsedMinutes !== undefined && (
                          <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>Took {step.elapsedMinutes} min from previous step</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 2. Order Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-ink">
                Items in Order ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-surface-2/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-11 w-11 rounded-[8px] border border-border/80 bg-white overflow-hidden shrink-0 flex items-center justify-center text-muted shadow-2xs">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={44}
                            height={44}
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-ink truncate">{item.name}</div>
                        <div className="text-[11px] text-muted">{item.unit}</div>
                        <div className="text-[11px] text-muted tabular-nums mt-0.5">
                          {formatINR(item.pricePaise)} × {item.qty}
                          {item.mrpPaise > item.pricePaise && (
                            <span className="line-through text-muted/60 ml-1.5">
                              {formatINR(item.mrpPaise)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-xs text-ink tabular-nums">
                        {formatINR(item.lineTotalPaise)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Price Breakdown Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-ink">Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal MRP</span>
                <span className="tabular-nums">
                  {formatINR(order.subtotalPaise + order.discountPaise)}
                </span>
              </div>

              {order.discountPaise > 0 && (
                <div className="flex justify-between text-[var(--tone-success-text)]">
                  <span>Product Discount</span>
                  <span className="tabular-nums">-{formatINR(order.discountPaise)}</span>
                </div>
              )}

              {order.couponPaise > 0 && (
                <div className="flex justify-between text-[var(--tone-success-text)]">
                  <span>Coupon ({order.couponCode})</span>
                  <span className="tabular-nums">-{formatINR(order.couponPaise)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted">
                <span>Delivery Fee</span>
                <span className="tabular-nums">
                  {order.deliveryPaise === 0 ? 'FREE' : formatINR(order.deliveryPaise)}
                </span>
              </div>

              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-sm text-ink">
                <span>Grand Total</span>
                <span className="tabular-nums text-base">{formatINR(order.totalPaise)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 columns): Customer, Address, Delivery, Payment, Notes, Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted" />
                <span className="font-semibold text-ink">{order.user.name}</span>
              </div>
              {order.user.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted" />
                  <a
                    href={`tel:${order.user.mobile}`}
                    className="text-accent hover:underline tabular-nums"
                  >
                    {order.user.mobile}
                  </a>
                </div>
              )}
              <div className="text-[11px] text-muted pt-1 border-t border-border">
                Lifetime orders: <span className="font-semibold text-ink">{order.user.totalOrdersCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                Delivery Address
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(fullAddressString, 'Address')}
                className="h-6 px-1.5 text-[11px] text-muted"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                <p className="text-ink leading-relaxed">{fullAddressString}</p>
              </div>
              <div className="pt-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Rider & Dispatch Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                Rider & ETA
              </CardTitle>
              {!isTerminal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingDelivery((prev) => !prev)}
                  className="h-6 px-1.5 text-[11px] text-accent"
                >
                  {isEditingDelivery ? 'Cancel' : 'Edit'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              {isEditingDelivery ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Rider Name"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Rider Phone (10 digits)"
                    value={riderPhone}
                    onChange={(e) => setRiderPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    loading={deliveryMutation.isPending}
                    onClick={() => deliveryMutation.mutate()}
                    className="w-full h-7 text-xs"
                  >
                    Save Rider
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Rider Name:</span>
                    <span className="font-semibold text-ink">{order.riderName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Rider Phone:</span>
                    {order.riderPhone ? (
                      <a href={`tel:${order.riderPhone}`} className="text-accent hover:underline tabular-nums">
                        {order.riderPhone}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Estimated ETA:</span>
                    <span className="tabular-nums">
                      {order.etaAt ? formatTimeIST(order.etaAt) : '10 min SLA'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Method</span>
                <span className="font-semibold text-ink uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <StatusPill tone={paymentMeta.tone} label={paymentMeta.label} />
              </div>
              {order.razorpayPaymentId && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted">Payment ID</span>
                  <span className="font-mono text-[11px] truncate max-w-[140px]">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Admin Note */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                Internal Note
              </CardTitle>
              {isSavingNote && <span className="text-[10px] text-muted">Saving...</span>}
            </CardHeader>
            <CardContent>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                onBlur={handleNoteBlur}
                placeholder="Private note for store staff (autosaves on blur)..."
                rows={3}
                className="w-full rounded-[8px] border border-border bg-surface-2 p-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </CardContent>
          </Card>

          {/* Activity / Audit History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {order.activities.length === 0 ? (
                <div className="p-4 text-xs text-muted text-center">No activity logged yet</div>
              ) : (
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {order.activities.map((act) => (
                    <div key={act.id} className="p-3 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{act.adminName}</span>
                        <span className="text-[10px] text-muted tabular-nums">
                          {formatTimeIST(act.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted capitalize">
                        {act.action.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Mobile (< 768px) */}
      {!isTerminal && nextAction && (
        <div className="sm:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-border">
          <Button
            size="lg"
            variant="primary"
            loading={statusMutation.isPending}
            onClick={() => {
              if (nextAction.status === 'out_for_delivery' && (!order.riderName || !order.riderPhone)) {
                setIsEditingDelivery(true);
                toast.error('Please assign rider first');
                return;
              }
              statusMutation.mutate({ nextStatus: nextAction.status });
            }}
            className="w-full text-sm font-semibold"
          >
            {nextAction.label}
          </Button>
        </div>
      )}

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--tone-danger-text)]">
              <ShieldAlert className="h-5 w-5" />
              <span>Cancel Order {order.code}</span>
            </DialogTitle>
            <DialogDescription>
              Cancelling will restore inventory stock automatically. Please specify a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-ink">Cancellation Reason (Required)</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Item out of stock">Item out of stock</option>
                <option value="Delivery address unreachable">Delivery address unreachable</option>
                <option value="Delayed SLA exceeding limit">Delayed SLA exceeding limit</option>
                <option value="Other administrative reason">Other administrative reason</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-ink">Additional Notes (Optional)</label>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Reason or customer communication details..."
                rows={2}
                className="w-full rounded-[8px] border border-border bg-surface p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(false)}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate({
                  nextStatus: 'cancelled',
                  reason: cancelReason,
                })
              }
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

