'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  Copy,
  Pencil,
  Percent,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCouponListItem, CouponInput } from '@jhatpat/shared';
import { PageHeader } from '@/components/layout/PageHeader';
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
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Input } from '@/components/ui/Input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { Switch } from '@/components/ui/Switch';
import { Tooltip } from '@/components/ui/Tooltip';
import { apiFetch } from '@/lib/api-client';
import { formatINR } from '@/lib/format';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponListItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState<'general' | 'bank' | 'wallet' | 'combo'>('general');
  const [type, setType] = useState<'percent' | 'flat' | 'free_delivery'>('percent');
  const [valueInput, setValueInput] = useState('20');
  const [minOrderRupees, setMinOrderRupees] = useState('199');
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('100');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [isActive, setIsActive] = useState(true);

  const { data: coupons = [], isLoading, error, refetch } = useQuery<AdminCouponListItem[]>({
    queryKey: ['admin', 'coupons'],
    queryFn: () => apiFetch('/api/v1/admin/coupons'),
    staleTime: 60 * 1000,
  });

  const openCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('');
    setSubtitle('');
    setImage('');
    setCategory('general');
    setType('percent');
    setValueInput('20');
    setMinOrderRupees('199');
    setMaxDiscountRupees('100');
    setValidFrom(new Date().toISOString().slice(0, 10));
    setValidTo(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setIsActive(true);
    setSheetOpen(true);
  };

  const openEdit = (c: AdminCouponListItem) => {
    setEditingCoupon(c);
    setCode(c.code);
    setTitle(c.title);
    setSubtitle(c.subtitle);
    setImage(c.image);
    setCategory(c.category);
    setType(c.type);
    setValueInput(c.type === 'flat' ? String(c.value / 100) : String(c.value));
    setMinOrderRupees(String(c.minOrderPaise / 100));
    setMaxDiscountRupees(c.maxDiscountPaise ? String(c.maxDiscountPaise / 100) : '');
    setValidFrom(c.validFrom.slice(0, 10));
    setValidTo(c.validTo.slice(0, 10));
    setIsActive(c.isActive);
    setSheetOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: CouponInput) => {
      if (editingCoupon) {
        return apiFetch(`/api/v1/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch('/api/v1/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      setSheetOpen(false);
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save coupon');
    },
  });

  // Active Toggle Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const c = coupons.find((item) => item.id === id);
      if (!c) return;
      return apiFetch(`/api/v1/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          code: c.code,
          title: c.title,
          subtitle: c.subtitle,
          image: c.image,
          category: c.category,
          type: c.type,
          value: c.value,
          minOrderPaise: c.minOrderPaise,
          maxDiscountPaise: c.maxDiscountPaise,
          validFrom: c.validFrom,
          validTo: c.validTo,
          isActive,
          sortOrder: c.sortOrder,
        }),
      });
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'coupons'] });
      const prevCoupons = queryClient.getQueryData<AdminCouponListItem[]>(['admin', 'coupons']);
      if (prevCoupons) {
        queryClient.setQueryData<AdminCouponListItem[]>(['admin', 'coupons'], (old) =>
          old ? old.map((c) => (c.id === id ? { ...c, isActive } : c)) : [],
        );
      }
      return { prevCoupons };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevCoupons) {
        queryClient.setQueryData(['admin', 'coupons'], context.prevCoupons);
      }
      toast.error('Failed to update coupon status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/api/v1/admin/coupons/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      setDeleteConfirmId(null);
      toast.success('Coupon deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete coupon');
    },
  });

  const handleCopy = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Coupon code copied');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!image) {
      toast.error('Coupon image is required');
      return;
    }

    let calculatedValue = 0;
    if (type === 'percent') {
      calculatedValue = parseInt(valueInput, 10);
      if (isNaN(calculatedValue) || calculatedValue <= 0 || calculatedValue > 100) {
        toast.error('Percentage must be between 1 and 100');
        return;
      }
    } else if (type === 'flat') {
      calculatedValue = Math.round(parseFloat(valueInput) * 100);
      if (isNaN(calculatedValue) || calculatedValue <= 0) {
        toast.error('Flat discount amount must be greater than 0');
        return;
      }
    }

    const minPaise = Math.round((parseFloat(minOrderRupees) || 0) * 100);
    const maxPaise = maxDiscountRupees ? Math.round(parseFloat(maxDiscountRupees) * 100) : null;

    saveMutation.mutate({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      image,
      category,
      type,
      value: calculatedValue,
      minOrderPaise: minPaise,
      maxDiscountPaise: maxPaise,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo + 'T23:59:59').toISOString(),
      isActive,
      sortOrder: editingCoupon ? editingCoupon.sortOrder : 0,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Create promotional discounts, bank offers, and minimum order vouchers for your store."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Coupon
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load coupons"
          description="An error occurred while fetching the coupons catalog."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="No coupons created"
          description="Create your first coupon voucher or promotional campaign."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Coupon
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const canDelete = c.usedCount === 0;

            return (
              <Card
                key={c.id}
                className="p-4 border border-border bg-surface hover:border-accent/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Image & Code & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border/80 bg-white shrink-0 shadow-2xs">
                      {c.image ? (
                        <Image src={c.image} alt={c.title} fill sizes="56px" className="object-contain p-1" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-fg">
                          <Tag className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground text-sm tracking-wider bg-surface-2 px-2 py-0.5 rounded border border-border">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="text-muted-fg hover:text-foreground"
                          title="Copy Code"
                        >
                          {copiedCode === c.code ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <StatusPill
                          tone={
                            c.status === 'active'
                              ? 'success'
                              : c.status === 'scheduled'
                                ? 'warning'
                                : c.status === 'expired'
                                  ? 'danger'
                                  : 'neutral'
                          }
                          label={c.status}
                        />
                      </div>

                      <div className="font-semibold text-foreground text-xs mt-1 truncate">
                        {c.title}
                        {c.subtitle && <span className="font-normal text-muted-fg"> — {c.subtitle}</span>}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-fg flex-wrap">
                        <span className="font-medium text-accent">{c.ruleSummary}</span>
                        <span>•</span>
                        <span>Used {c.usedCount} times</span>
                        <span>•</span>
                        <span>
                          Valid until {new Date(c.validTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Active Switch & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <label className="flex items-center gap-1.5 cursor-pointer pr-3 border-r border-border">
                      <span className="text-muted-fg text-[11px]">Active</span>
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(val) => toggleActiveMutation.mutate({ id: c.id, isActive: val })}
                      />
                    </label>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(c)}
                      className="h-8 w-8 p-0"
                      title="Edit coupon"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-fg" />
                    </Button>

                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/10"
                        title="Delete coupon"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Tooltip content={`Cannot delete coupon because it has been used in ${c.usedCount} order(s). Deactivate it instead.`}>
                        <span tabIndex={0}>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 opacity-40 cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Coupon Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingCoupon ? `Edit ${editingCoupon.code}` : 'New Coupon'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Live Customer Preview Card */}
            <div className="p-3.5 rounded-xl border border-dashed border-accent/40 bg-accent/5 space-y-2">
              <span className="text-[10px] uppercase font-bold text-accent tracking-wider block">
                Live Storefront Preview
              </span>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-lg bg-surface border border-border overflow-hidden shrink-0">
                  {image ? (
                    <Image src={image} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-fg">
                      <Percent className="h-5 w-5 text-accent" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-mono font-bold text-foreground text-xs uppercase tracking-wide">
                    {code || 'COUPONCODE'}
                  </div>
                  <div className="font-semibold text-foreground text-xs truncate">
                    {title || 'Coupon Title'}
                  </div>
                  <div className="text-[11px] text-muted-fg truncate">
                    {subtitle || 'Voucher details and conditions'}
                  </div>
                </div>
              </div>
            </div>

            {/* Code & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Coupon Code *
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20"
                  required
                  className="font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="general">General</option>
                  <option value="bank">Bank / Card</option>
                  <option value="wallet">Wallet</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Discount Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {type === 'percent' ? 'Discount Percentage (%) *' : type === 'flat' ? 'Flat Amount (₹) *' : 'Value'}
                </label>
                <Input
                  type="number"
                  min="0"
                  max={type === 'percent' ? 100 : undefined}
                  value={type === 'free_delivery' ? '0' : valueInput}
                  disabled={type === 'free_delivery'}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder={type === 'percent' ? '20' : '100.00'}
                  required={type !== 'free_delivery'}
                />
              </div>
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Min Order Amount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={minOrderRupees}
                  onChange={(e) => setMinOrderRupees(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Max Cap (₹, for % only)
                </label>
                <Input
                  type="number"
                  min="0"
                  disabled={type !== 'percent'}
                  value={maxDiscountRupees}
                  onChange={(e) => setMaxDiscountRupees(e.target.value)}
                  placeholder="Optional cap"
                />
              </div>
            </div>

            {/* Titles */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Title / Heading *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Get 20% OFF on all groceries"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Subtitle / Description
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Valid on first 3 orders above ₹199"
              />
            </div>

            {/* Validity Date Window */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  End Date *
                </label>
                <Input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Coupon Badge Image *
              </label>
              <ImageUploader
                value={image ? [{ url: image }] : []}
                onChange={(imgs) => setImage(imgs[0]?.url || '')}
                max={1}
                kind="banner"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <span className="text-sm font-medium text-foreground block">Active Voucher</span>
                <span className="text-xs text-muted-fg">Customers can apply at checkout</span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={saveMutation.isPending} className="flex-1">
                {editingCoupon ? 'Save Changes' : 'Create Coupon'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

