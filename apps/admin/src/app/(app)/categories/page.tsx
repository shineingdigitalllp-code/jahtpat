'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  FolderTree,
  MoveDown,
  MoveUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCategoryNode, CategoryInput } from '@jhatpat/shared';
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
import { Tooltip } from '@/components/ui/Tooltip';
import { apiFetch } from '@/lib/api-client';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryNode | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Fetch categories tree
  const { data: tree = [], isLoading, error } = useQuery<AdminCategoryNode[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch('/api/v1/admin/categories'),
    staleTime: 60 * 1000,
  });

  const openCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setImage('');
    setFeatured(false);
    setIsActive(true);
    setSheetOpen(true);
  };

  const openEdit = (cat: AdminCategoryNode) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setImage(cat.image);
    setFeatured(cat.featured);
    setIsActive(cat.isActive);
    setSheetOpen(true);
  };

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: CategoryInput) => {
      if (editingCategory) {
        return apiFetch(`/api/v1/admin/categories/${editingCategory.id}`, {
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
      toast.success(editingCategory ? 'Parent category updated' : 'Parent category created');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save category');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!image) {
      toast.error('Category image is required');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      slug: slug.trim() || undefined,
      parentId: null, // Always top-level on this page
      image,
      featured,
      isActive,
      sortOrder: editingCategory ? editingCategory.sortOrder : 0,
    });
  };

  // Quick toggle active / featured
  const quickToggleMutation = useMutation({
    mutationFn: async ({ id, key, value }: { id: number; key: 'isActive' | 'featured'; value: boolean }) => {
      const cat = tree.find((c) => c.id === id);
      if (!cat) return;
      return apiFetch(`/api/v1/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          image: cat.image,
          featured: key === 'featured' ? value : cat.featured,
          isActive: key === 'isActive' ? value : cat.isActive,
          sortOrder: cat.sortOrder,
        }),
      });
    },
    onMutate: async ({ id, key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] });
      const prevTree = queryClient.getQueryData<AdminCategoryNode[]>(['admin', 'categories']);

      queryClient.setQueryData<AdminCategoryNode[]>(['admin', 'categories'], (old) => {
        if (!old) return [];
        return old.map((cat) => (cat.id === id ? { ...cat, [key]: value } : cat));
      });

      return { prevTree };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevTree) {
        queryClient.setQueryData(['admin', 'categories'], context.prevTree);
      }
      toast.error('Failed to update category setting');
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
    if (targetIndex < 0 || targetIndex >= tree.length) return;

    const current = tree[index];
    const target = tree[targetIndex];
    if (!current || !target) return;

    const cloned = [...tree];
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
      toast.success('Category deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete category');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parent Categories"
        description="Top-level departments in your store. Click 'Manage Subcategories' on any category to view and organize its subcategories."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Parent Category
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
          title="Failed to load categories"
          description="An error occurred while fetching the category list."
          action={<Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })}>Retry</Button>}
        />
      ) : tree.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create your first parent category (e.g. Vegetables & Fruits, Dairy & Breakfast)."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Parent Category
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tree.map((cat, index) => {
            const subCount = cat.children ? cat.children.length : 0;
            const canDelete = subCount === 0 && cat.productCount === 0;

            return (
              <Card key={cat.id} className="p-4 border border-border bg-surface hover:border-accent/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Category thumbnail and title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border/80 bg-white shrink-0 shadow-2xs">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill sizes="56px" className="object-contain p-1" />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/categories/${cat.id}`}
                          className="font-bold text-foreground text-sm hover:text-accent transition-colors truncate"
                        >
                          {cat.name}
                        </Link>
                        <span className="text-xs text-muted-fg font-mono">/{cat.slug}</span>
                      </div>

                      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                        <Link href={`/categories/${cat.id}`}>
                          <Badge variant="accent" className="cursor-pointer hover:opacity-80">
                            <FolderTree className="h-3 w-3 mr-1" />
                            {subCount} Subcategories
                          </Badge>
                        </Link>
                        <span className="text-xs text-muted-fg">•</span>
                        <span className="text-xs text-muted-fg">
                          {cat.productCount} Total Products
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & controls */}
                  <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap sm:flex-nowrap">
                    {/* Featured & Active switches */}
                    <div className="flex items-center gap-3 text-xs pr-3 border-r border-border">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-muted-fg text-[11px]">Featured</span>
                        <Switch
                          checked={cat.featured}
                          onCheckedChange={(val) =>
                            quickToggleMutation.mutate({ id: cat.id, key: 'featured', value: val })
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="text-muted-fg text-[11px]">Active</span>
                        <Switch
                          checked={cat.isActive}
                          onCheckedChange={(val) =>
                            quickToggleMutation.mutate({ id: cat.id, key: 'isActive', value: val })
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
                        disabled={index === tree.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        title="Move down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Manage Subcategories Navigation Button */}
                    <Link href={`/categories/${cat.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                        Manage Subcategories
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>

                    {/* Edit Parent */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(cat)}
                      className="h-8 w-8 p-0"
                      title="Edit parent category"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-fg" />
                    </Button>

                    {/* Delete Parent */}
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(cat.id)}
                        className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/10"
                        title="Delete category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Tooltip content="Cannot delete category while it has subcategories or products. Remove them first.">
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

      {/* Create / Edit Parent Category Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingCategory ? `Edit ${editingCategory.name}` : 'New Parent Category'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Category Name *
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCategory && !slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    );
                  }
                }}
                placeholder="e.g. Vegetables & Fruits"
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
                placeholder="vegetables-fruits"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Department Image *
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
                <span className="text-sm font-medium text-foreground block">Featured Category</span>
                <span className="text-xs text-muted-fg">Show prominently on homepage</span>
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
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this parent category? This action cannot be undone.
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
