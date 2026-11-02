'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  ExternalLink,
  History,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCustomerDetail } from '@jhatpat/shared';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const queryClient = useQueryClient();
  const { admin } = useAdmin();
  const isStaff = admin?.role === 'staff';

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wallet'>('orders');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  // Wallet adjustment form state
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmountRupees, setAdjustAmountRupees] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: customer, isLoading, error, refetch } = useQuery<AdminCustomerDetail>({
    queryKey: ['admin', 'customers', id],
    queryFn: () => apiFetch(`/api/v1/admin/customers/${id}`),
    staleTime: 30 * 1000,
  });

  // Block / Unblock Mutation
  const blockMutation = useMutation({
    mutationFn: async (blocked: boolean) => {
      return apiFetch(`/api/v1/admin/customers/${id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ blocked }),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      setBlockDialogOpen(false);
      toast.success(variables ? 'Customer has been blocked' : 'Customer has been unblocked');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update customer status');
    },
  });

  // Wallet Adjustment Mutation
  const walletMutation = useMutation({
    mutationFn: async ({ amountPaise, reason }: { amountPaise: number; reason: string }) => {
      return apiFetch(`/api/v1/admin/customers/${id}/wallet`, {
        method: 'POST',
        body: JSON.stringify({ amountPaise, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers', id] });
      setWalletDialogOpen(false);
      setAdjustAmountRupees('');
      setAdjustReason('');
      toast.success('Wallet balance adjusted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to adjust wallet balance');
    },
  });

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(adjustAmountRupees);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Reason for adjustment is required');
      return;
    }

    const amountPaise = Math.round(amountNum * 100) * (adjustType === 'credit' ? 1 : -1);
    walletMutation.mutate({ amountPaise, reason: adjustReason.trim() });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="The customer account could not be found."
        action={
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top back nav */}
      <div className="flex items-center gap-2">
        <Link href="/customers">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-xs text-muted-fg">Back to Customers</span>
      </div>

      {/* Customer Header Card */}
      <Card className="p-5 border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={customer.name} size="lg" />

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{customer.name}</h1>
              <StatusPill
                tone={customer.isBlocked ? 'danger' : 'success'}
                label={customer.isBlocked ? 'Blocked' : 'Active'}
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-fg mt-1 flex-wrap">
              {customer.mobile && (
                <a
                  href={`tel:${customer.mobile}`}
                  className="flex items-center gap-1.5 hover:text-foreground font-mono"
                >
                  <Phone className="h-3 w-3" />
                  <span>+91 {customer.mobile}</span>
                </a>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  <span>{customer.email}</span>
                </div>
              )}
              <span>Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {!isStaff && (
          <Button
            variant={customer.isBlocked ? 'outline' : 'danger'}
            size="sm"
            onClick={() => setBlockDialogOpen(true)}
            className="self-start sm:self-auto"
          >
            {customer.isBlocked ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1.5 text-success" />
                Unblock Customer
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-1.5" />
                Block Customer
              </>
            )}
          </Button>
        )}
      </Card>

      {/* Stats Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">Total Orders</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {customer.stats.ordersCount}
          </div>
        </Card>

        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">Lifetime Spend</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {formatINR(customer.stats.lifetimeSpendPaise)}
          </div>
        </Card>

        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-fg font-medium">Average Order Value (AOV)</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {formatINR(customer.stats.aovPaise)}
          </div>
        </Card>

        <Card className="p-4 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-fg font-medium">Wallet Balance</span>
            {!isStaff && (
              <button
                onClick={() => setWalletDialogOpen(true)}
                className="text-[11px] text-accent font-medium hover:underline flex items-center gap-0.5"
              >
                <Plus className="h-3 w-3" />
                Adjust
              </button>
            )}
          </div>
          <div className="text-2xl font-bold tracking-tight text-accent mt-1">
            {formatINR(customer.stats.walletBalancePaise)}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-fg hover:text-foreground'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Orders ({customer.recentOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'addresses'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-fg hover:text-foreground'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Addresses ({customer.addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'wallet'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-fg hover:text-foreground'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Wallet Ledger ({customer.walletTransactions.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {customer.recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="This customer hasn't placed any orders so far."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 text-muted-fg border-b border-border">
                  <tr>
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium">Items</th>
                    <th className="p-3 font-medium">Total</th>
                    <th className="p-3 font-medium">Payment</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customer.recentOrders.map((o) => (
                    <tr key={o.code} className="hover:bg-surface-2/50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-foreground">
                        <Link href={`/orders/${o.code}`} className="hover:text-accent">
                          {o.code}
                        </Link>
                      </td>
                      <td className="p-3">{o.itemCount} items</td>
                      <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                        {formatINR(o.totalPaise)}
                      </td>
                      <td className="p-3 uppercase text-[11px] text-muted-fg">
                        {o.paymentMethod} • {o.paymentStatus}
                      </td>
                      <td className="p-3">
                        <StatusPill tone="neutral" label={o.status} />
                      </td>
                      <td className="p-3 text-muted-fg whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/orders/${o.code}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customer.addresses.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="No saved addresses"
                description="This customer has not added any delivery addresses."
              />
            </div>
          ) : (
            customer.addresses.map((a) => (
              <Card key={a.id} className="p-4 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs uppercase tracking-wide">
                    {a.label}
                  </span>
                  {a.isDefault && <Badge variant="accent">Default</Badge>}
                </div>
                <div className="text-xs text-muted-fg leading-relaxed">
                  <div>{a.line1}</div>
                  {a.line2 && <div>{a.line2}</div>}
                  <div>
                    {a.city}, {a.state} - {a.pincode}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
            {!isStaff && (
              <Button size="sm" onClick={() => setWalletDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Adjust Balance
              </Button>
            )}
          </div>

          {customer.walletTransactions.length === 0 ? (
            <EmptyState
              title="No wallet transactions"
              description="No manual balance credits or debits have been made for this customer."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 text-muted-fg border-b border-border">
                  <tr>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Reason</th>
                    <th className="p-3 font-medium">Adjusted By</th>
                    <th className="p-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customer.walletTransactions.map((t) => {
                    const isCredit = t.amountPaise > 0;
                    return (
                      <tr key={t.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="p-3">
                          <Badge variant={isCredit ? 'accent' : 'neutral'}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </Badge>
                        </td>
                        <td
                          className={`p-3 font-bold whitespace-nowrap ${
                            isCredit ? 'text-success' : 'text-danger-fg'
                          }`}
                        >
                          {isCredit ? '+' : ''}
                          {formatINR(t.amountPaise)}
                        </td>
                        <td className="p-3 text-foreground max-w-sm">{t.reason}</td>
                        <td className="p-3 text-muted-fg">{t.adminName}</td>
                        <td className="p-3 text-right text-muted-fg whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Block Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{customer.isBlocked ? 'Unblock Customer' : 'Block Customer'}</DialogTitle>
            <DialogDescription>
              {customer.isBlocked
                ? `Are you sure you want to unblock ${customer.name}? They will be able to log in and place orders again.`
                : `Are you sure you want to block ${customer.name}? They will not be able to log in or place orders.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={customer.isBlocked ? 'primary' : 'danger'}
              loading={blockMutation.isPending}
              onClick={() => blockMutation.mutate(!customer.isBlocked)}
            >
              {customer.isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Wallet Balance Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
            <DialogDescription>
              Manually credit or debit funds to {customer.name}&apos;s in-store wallet. All adjustments are logged with your name.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWalletSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Action</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                    adjustType === 'credit'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-fg hover:text-foreground'
                  }`}
                >
                  Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                    adjustType === 'debit'
                      ? 'border-danger bg-danger/10 text-danger-fg'
                      : 'border-border text-muted-fg hover:text-foreground'
                  }`}
                >
                  Debit (-)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Amount (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={adjustAmountRupees}
                onChange={(e) => setAdjustAmountRupees(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Reason / Note *
              </label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Promotional gift / Compensation for delayed item"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setWalletDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={walletMutation.isPending}>
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
