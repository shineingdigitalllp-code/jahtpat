'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MoveDown,
  MoveUp,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCategoryNode, CategoryInput } from '@jhatpat/shared';
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
import { Tooltip } from '@/components/ui/Tooltip';
import { apiFetch } from '@/lib/api-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubcategoriesPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const parentId = Number(resolvedParams.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<AdminCategoryNode | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Fetch full category tree
  const { data: tree = [], isLoading, error } = useQuery<AdminCategoryNode[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch('/api/v1/admin/categories'),
    staleTime: 60 * 1000,
  });

  const parent = tree.find((c) => c.id === parentId);
  const subcategories = parent?.children || [];

  const openCreate = () => {
    setEditingSubcategory(null);
    setName('');
    setSlug('');
    setImage('');
    setFeatured(false);
    setIsActive(true);
    setSheetOpen(true);
  };

  const openEdit = (sub: AdminCategoryNode) => {
    setEditingSubcategory(sub);
    setName(sub.name);
    setSlug(sub.slug);
    setImage(sub.image);
    setFeatured(sub.featured);
    setIsActive(sub.isActive);
    setSheetOpen(true);
  };

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: CategoryInput) => {
      if (editingSubcategory) {
        return apiFetch(`/api/v1/admin/categories/${editingSubcategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch('/api/v1/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setSheetOpen(false);
      toast.success(editingSubcategory ? 'Subcategory updated' : 'Subcategory created');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save subcategory');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }
    if (!image) {
      toast.error('Subcategory image is required');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      slug: slug.trim() || undefined,
      parentId,
      image,
      featured,
      isActive,
      sortOrder: editingSubcategory ? editingSubcategory.sortOrder : 0,
    });
  };

  // Quick toggle active / featured
  const quickToggleMutation = useMutation({
    mutationFn: async ({ id, key, value }: { id: number; key: 'isActive' | 'featured'; value: boolean }) => {
      const sub = subcategories.find((c) => c.id === id);
      if (!sub) return;
      return apiFetch(`/api/v1/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: sub.name,
          slug: sub.slug,
          parentId,
          image: sub.image,
          featured: key === 'featured' ? value : sub.featured,
          isActive: key === 'isActive' ? value : sub.isActive,
          sortOrder: sub.sortOrder,
        }),
      });
    },
    onMutate: async ({ id, key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] });
      const prevTree = queryClient.getQueryData<AdminCategoryNode[]>(['admin', 'categories']);

      queryClient.setQueryData<AdminCategoryNode[]>(['admin', 'categories'], (old) => {
        if (!old) return [];
        return old.map((p) => {
          if (p.id === parentId) {
            return {
              ...p,
              children: p.children.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
            };
          }
          return p;
        });
      });

      return { prevTree };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevTree) {
        queryClient.setQueryData(['admin', 'categories'], context.prevTree);
      }
      toast.error('Failed to update subcategory setting');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; sortOrder: number }[]) => {
      return apiFetch('/api/v1/admin/categories/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: () => {
      toast.error('Failed to update sort order');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subcategories.length) return;

    const current = subcategories[index];
    const target = subcategories[targetIndex];
    if (!current || !target) return;

    const cloned = [...subcategories];
    cloned[index] = target;
    cloned[targetIndex] = current;

    const reorderedPayload = cloned.map((c, i) => ({
      id: c.id,
      sortOrder: i,
    }));

    reorderMutation.mutate(reorderedPayload);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/api/v1/admin/categories/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setDeleteConfirmId(null);
      toast.success('Subcategory deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete subcategory');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <EmptyState
        title="Parent category not found"
        description="The parent category does not exist or may have been removed."
        action={
          <Link href="/categories">
            <Button>Back to Categories</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-fg mb-3">
          <Link href="/categories" className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Parent Categories</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-fg/60" />
          <span className="text-foreground font-semibold">{parent.name}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-fg/60" />
          <span>Subcategories</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border/80 bg-white shrink-0 shadow-2xs">
              {parent.image ? (
                <Image src={parent.image} alt={parent.name} fill sizes="48px" className="object-contain p-1" />
              ) : null}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {parent.name} Subcategories
              </h1>
              <p className="text-xs text-muted-fg mt-0.5">
                {subcategories.length} subcategories under this department. Products are assigned directly to subcategories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Quick Department Switcher */}
            <select
              value={parentId}
              onChange={(e) => router.push(`/categories/${e.target.value}`)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {tree.map((p) => (
                <option key={p.id} value={p.id}>
                  Dept: {p.name}
                </option>
              ))}
            </select>

            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Subcategory
            </Button>
          </div>
        </div>
      </div>

      {/* Subcategory List */}
      {subcategories.length === 0 ? (
        <EmptyState
          title={`No subcategories under ${parent.name}`}
          description="Add subcategories to organize products under this department."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Subcategory
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {subcategories.map((sub, index) => {
            const canDelete = sub.productCount === 0;

            return (
              <Card
                key={sub.id}
                className="p-3.5 border border-border bg-surface hover:border-accent/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-border/80 bg-white shrink-0 shadow-2xs">
                      {sub.image ? (
                        <Image src={sub.image} alt={sub.name} fill sizes="44px" className="object-contain p-1" />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm truncate">{sub.name}</span>
                        <span className="text-xs text-muted-fg font-mono">/{sub.slug}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/products?categoryId=${sub.id}`}>
                          <Badge variant="neutral" className="hover:bg-surface-2 cursor-pointer transition-colors text-[10px]">
                            <Package className="h-3 w-3 mr-1" />
                            {sub.productCount} Products
                            <ExternalLink className="h-2.5 w-2.5 ml-1 text-muted-fg" />
                          </Badge>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Actions & controls */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Featured & Active switches */}
                    <div className="flex items-center gap-3 text-xs pr-3 border-r border-border">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-muted-fg text-[11px]">Featured</span>
                        <Switch
                          checked={sub.featured}
                          onCheckedChange={(val) =>
                            quickToggleMutation.mutate({ id: sub.id, key: 'featured', value: val })
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-muted-fg text-[11px]">Active</span>
                        <Switch
                          checked={sub.isActive}
                          onCheckedChange={(val) =>
                            quickToggleMutation.mutate({ id: sub.id, key: 'isActive', value: val })
                          }
                        />
                      </label>
                    </div>

                    {/* Move Up/Down Order */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        title="Move up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={index === subcategories.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        title="Move down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Edit Subcategory */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(sub)}
                      className="h-8 w-8 p-0"
                      title="Edit subcategory"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-fg" />
                    </Button>

                    {/* Delete Subcategory */}
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(sub.id)}
                        className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/10"
                        title="Delete subcategory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Tooltip content="Cannot delete subcategory because products are assigned to it. Reassign products first.">
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

      {/* Create / Edit Subcategory Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingSubcategory ? `Edit ${editingSubcategory.name}` : `New Subcategory in ${parent.name}`}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-6">
            <div className="p-3 rounded-lg bg-surface-2 border border-border">
              <span className="text-[11px] text-muted-fg block">Parent Category</span>
              <span className="text-xs font-semibold text-foreground mt-0.5 block">{parent.name}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Subcategory Name *
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingSubcategory && !slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    );
                  }
                }}
                placeholder="e.g. Exotic Vegetables"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                URL Slug (optional)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="exotic-vegetables"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Subcategory Image *
              </label>
              <ImageUploader
                value={image ? [{ url: image }] : []}
                onChange={(imgs) => setImage(imgs[0]?.url || '')}
                max={1}
                kind="category"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <span className="text-sm font-medium text-foreground block">Featured Subcategory</span>
                <span className="text-xs text-muted-fg">Show prominently on parent landing</span>
              </div>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <span className="text-sm font-medium text-foreground block">Active</span>
                <span className="text-xs text-muted-fg">Visible to storefront customers</span>
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
                {editingSubcategory ? 'Save Changes' : 'Create Subcategory'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subcategory</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subcategory? This action cannot be undone.
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

