'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  MoveDown,
  MoveUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminBannerListItem, AdminCategoryNode, BannerInput } from '@jhatpat/shared';
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
import { Switch } from '@/components/ui/Switch';
import { apiFetch } from '@/lib/api-client';

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'home' | 'offers' | 'category'>('home');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBannerListItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [placement, setPlacement] = useState<'home' | 'offers'>('home');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Shop Now');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Categories for category banners
  const { data: categories = [] } = useQuery<AdminCategoryNode[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch('/api/v1/admin/categories'),
    staleTime: 60 * 1000,
  });

  // Fetch banners for current tab
  const { data: banners = [], isLoading, error, refetch } = useQuery<AdminBannerListItem[]>({
    queryKey: ['admin', 'banners', tab],
    queryFn: () => apiFetch(`/api/v1/admin/banners?placement=${tab}`),
    staleTime: 30 * 1000,
  });

  const openCreate = () => {
    setEditingBanner(null);
    setPlacement(tab === 'offers' ? 'offers' : 'home');
    setCategoryId(tab === 'category' ? (categories[0]?.id ?? '') : '');
    setTitle('');
    setSubtitle('');
    setCtaLabel('Shop Now');
    setImage('');
    setLink(tab === 'category' ? `/category/${categories[0]?.slug ?? ''}` : '/category/fresh-vegetables');
    setIsActive(true);
    setSheetOpen(true);
  };

  const openEdit = (b: AdminBannerListItem) => {
    setEditingBanner(b);
    setPlacement(b.placement);
    setCategoryId(b.categoryId ?? '');
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setCtaLabel(b.ctaLabel);
    setImage(b.image);
    setLink(b.link);
    setIsActive(b.isActive);
    setSheetOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: BannerInput) => {
      if (editingBanner) {
        return apiFetch(`/api/v1/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch('/api/v1/admin/banners', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setSheetOpen(false);
      toast.success(editingBanner ? 'Banner updated' : 'Banner created');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save banner');
    },
  });

  // Active Toggle Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const b = banners.find((item) => item.id === id);
      if (!b) return;
      return apiFetch(`/api/v1/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          placement: b.placement,
          categoryId: b.categoryId,
          title: b.title,
          subtitle: b.subtitle,
          ctaLabel: b.ctaLabel,
          image: b.image,
          link: b.link,
          sortOrder: b.sortOrder,
          isActive,
        }),
      });
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'banners', tab] });
      const prev = queryClient.getQueryData<AdminBannerListItem[]>(['admin', 'banners', tab]);
      if (prev) {
        queryClient.setQueryData<AdminBannerListItem[]>(['admin', 'banners', tab], (old) =>
          old ? old.map((b) => (b.id === id ? { ...b, isActive } : b)) : [],
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['admin', 'banners', tab], context.prev);
      }
      toast.error('Failed to update banner status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
  });

  // Reorder Mutation
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; sortOrder: number }[]) => {
      return apiFetch('/api/v1/admin/banners/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners', tab] });
    },
    onError: () => {
      toast.error('Failed to reorder banners');
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners', tab] });
    },
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const current = banners[index];
    const target = banners[targetIndex];
    if (!current || !target) return;

    const cloned = [...banners];
    cloned[index] = target;
    cloned[targetIndex] = current;

    const reorderedPayload = cloned.map((b, i) => ({
      id: b.id,
      sortOrder: i,
    }));

    reorderMutation.mutate(reorderedPayload);
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/api/v1/admin/banners/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setDeleteConfirmId(null);
      toast.success('Banner deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete banner');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Banner title is required');
      return;
    }
    if (!image) {
      toast.error('Banner image is required');
      return;
    }
    if (!link.startsWith('/')) {
      toast.error('Link must start with / (e.g. /category/fruits)');
      return;
    }

    saveMutation.mutate({
      placement: tab === 'category' ? 'home' : placement,
      categoryId: tab === 'category' && categoryId ? Number(categoryId) : null,
      title: title.trim(),
      subtitle: subtitle.trim(),
      ctaLabel: ctaLabel.trim() || 'Shop Now',
      image,
      link: link.trim(),
      sortOrder: editingBanner ? editingBanner.sortOrder : 0,
      isActive,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description="Manage promotional billboard hero cards on the homepage, offers page, and specific categories."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Banner
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border gap-4 text-xs font-medium">
        <button
          onClick={() => setTab('home')}
          className={`pb-2.5 border-b-2 transition-colors ${
            tab === 'home'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-fg hover:text-foreground'
          }`}
        >
          Homepage Billboard
        </button>
        <button
          onClick={() => setTab('offers')}
          className={`pb-2.5 border-b-2 transition-colors ${
            tab === 'offers'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-fg hover:text-foreground'
          }`}
        >
          Offers Page
        </button>
        <button
          onClick={() => setTab('category')}
          className={`pb-2.5 border-b-2 transition-colors ${
            tab === 'category'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted-fg hover:text-foreground'
          }`}
        >
          Category Headers
        </button>
      </div>

      {/* Banners Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/9] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load banners"
          description="An error occurred while fetching banners."
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      ) : banners.length === 0 ? (
        <EmptyState
          title={`No ${tab} banners found`}
          description="Add your first visual campaign or promotional banner."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Banner
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((b, index) => (
            <Card
              key={b.id}
              className="overflow-hidden border border-border bg-surface p-0 flex flex-col hover:border-accent/30 transition-colors"
            >
              {/* 16:9 Image Preview */}
              <div className="relative aspect-[16/9] w-full bg-surface-2 border-b border-border overflow-hidden">
                {b.image ? (
                  <Image src={b.image} alt={b.title} fill className="object-cover" />
                ) : null}

                {/* Status overlay badge */}
                <div className="absolute top-2.5 left-2.5">
                  <Badge variant={b.isActive ? 'accent' : 'neutral'}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {b.categoryName && (
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="neutral">{b.categoryName}</Badge>
                  </div>
                )}
              </div>

              {/* Banner Info */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{b.title}</h3>
                  {b.subtitle && (
                    <p className="text-xs text-muted-fg mt-0.5 line-clamp-2">{b.subtitle}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-accent mt-2 font-mono truncate">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span>{b.link}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-muted-fg text-[11px]">Active</span>
                    <Switch
                      checked={b.isActive}
                      onCheckedChange={(val) => toggleActiveMutation.mutate({ id: b.id, isActive: val })}
                    />
                  </label>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      title="Move left/up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      title="Move right/down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(b)}
                      className="h-7 w-7 p-0"
                      title="Edit banner"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-fg" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(b.id)}
                      className="h-7 w-7 p-0 text-danger-fg hover:bg-danger/10"
                      title="Delete banner"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Banner Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingBanner ? `Edit Banner` : `New ${tab} Banner`}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {tab === 'category' && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Banner Image (16:9 Aspect Ratio) *
              </label>
              <ImageUploader
                value={image ? [{ url: image }] : []}
                onChange={(imgs) => setImage(imgs[0]?.url || '')}
                max={1}
                kind="banner"
              />
              <p className="text-[11px] text-muted-fg mt-1">Recommended size: 1200x675 px (16:9)</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Heading / Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fresh Mangoes Season"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Subtitle
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Sweet Alphonso direct from Ratnagiri"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  CTA Button Label
                </label>
                <Input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Shop Now"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Target Link *
                </label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/category/fruits"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <span className="text-sm font-medium text-foreground block">Active</span>
                <span className="text-xs text-muted-fg">Display on storefront</span>
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
                {editingBanner ? 'Save Changes' : 'Create Banner'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promotional banner?
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

