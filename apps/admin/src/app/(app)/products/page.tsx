'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  AdminCategoryNode,
  AdminProductListItem,
  AdminProductListResponse,
} from '@jhatpat/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
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
import { ProductImportDialog } from '@/components/products/ProductImportDialog';
import { Switch } from '@/components/ui/Switch';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { formatINR } from '@/lib/format';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { admin } = useAdmin();
  const isStaff = admin?.role === 'staff';

  const [tab, setTab] = useState<'all' | 'active' | 'inactive' | 'low' | 'out'>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState('updatedAt_desc');

  // Selected row IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState<number | ''>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery<AdminCategoryNode[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch('/api/v1/admin/categories'),
    staleTime: 60 * 1000,
  });

  // Fetch products
  const { data, isLoading, error } = useQuery<AdminProductListResponse>({
    queryKey: ['admin', 'products', { page, tab, categoryId, search: debouncedSearch, sort }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (tab !== 'all') params.set('tab', tab);
      if (categoryId) params.set('categoryId', String(categoryId));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (sort) params.set('sort', sort);
      return apiFetch(`/api/v1/admin/products?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });

  const products = data?.items || [];
  const meta = data?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 1 };
  const tabCounts = data?.tabCounts || { all: 0, active: 0, inactive: 0, low: 0, out: 0 };

  // Status toggle mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiFetch(`/api/v1/admin/products/${id}/quick`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'products'] });
      const queryKey = ['admin', 'products', { page, tab, categoryId, search: debouncedSearch, sort }];
      const prevData = queryClient.getQueryData<AdminProductListResponse>(queryKey);

      if (prevData) {
        queryClient.setQueryData<AdminProductListResponse>(queryKey, {
          ...prevData,
          items: prevData.items.map((item) =>
            item.id === id ? { ...item, isActive } : item,
          ),
        });
      }

      return { prevData, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(context.queryKey, context.prevData);
      }
      toast.error('Failed to update product status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  // Stock edit mutation
  const stockEditMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      return apiFetch(`/api/v1/admin/products/${id}/quick`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Stock updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update stock');
    },
  });

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: async (payload: { action: 'activate' | 'deactivate' | 'set_category'; categoryId?: number }) => {
      return apiFetch('/api/v1/admin/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          ids: selectedIds,
          action: payload.action,
          categoryId: payload.categoryId,
        }),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSelectedIds([]);
      setBulkCategoryModalOpen(false);
      const actionName =
        variables.action === 'activate'
          ? 'Products activated'
          : variables.action === 'deactivate'
            ? 'Products deactivated'
            : 'Category updated';
      toast.success(actionName);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to apply bulk action');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`/api/v1/admin/products/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setDeleteConfirmId(null);
      toast.success('Product deleted');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete product');
    },
  });

  // Row selection helpers
  const allCurrentSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('tab', tab);
    if (categoryId) params.set('categoryId', String(categoryId));
    if (debouncedSearch) params.set('search', debouncedSearch);
    window.open(`/api/v1/admin/products/export.csv?${params.toString()}`, '_blank');
  };

  const tabsConfig = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'active', label: 'Active', count: tabCounts.active },
    { key: 'inactive', label: 'Inactive', count: tabCounts.inactive },
    { key: 'low', label: 'Low Stock', count: tabCounts.low },
    { key: 'out', label: 'Out of Stock', count: tabCounts.out },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage product catalog, pricing, stock levels, and storefront visibility."
        actions={
          <div className="flex items-center gap-2">
            {!isStaff && (
              <>
                <Button variant="outline" onClick={() => setImportModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={handleExportCsv}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Export CSV
                </Button>
              </>
            )}
            {!isStaff && (
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Product
                </Button>
              </Link>
            )}
          </div>
        }
      />

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-fg" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or category..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category Filter */}
          <select
            value={categoryId ?? ''}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                <option value={cat.id}>{cat.name} (All)</option>
                {cat.children.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    &nbsp;&nbsp;{sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
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
            <option value="updatedAt_desc">Recently Updated</option>
            <option value="name_asc">Name (A - Z)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="stock_asc">Stock (Low to High)</option>
            <option value="stock_desc">Stock (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && !isStaff && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-border">
          <span className="text-xs font-semibold whitespace-nowrap">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-background/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => bulkMutation.mutate({ action: 'activate' })}
            className="text-xs text-background hover:bg-background/20 h-7"
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => bulkMutation.mutate({ action: 'deactivate' })}
            className="text-xs text-background hover:bg-background/20 h-7"
          >
            Deactivate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBulkCategoryModalOpen(true)}
            className="text-xs text-background hover:bg-background/20 h-7"
          >
            Change Category
          </Button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-md text-background/60 hover:text-background"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Products Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load products"
          description="An error occurred while fetching the product catalog."
          action={<Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })}>Retry</Button>}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description={
            search || categoryId || tab !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Add your first product to get your store up and running.'
          }
          action={
            !isStaff ? (
              <Link href="/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Product
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted-fg border-b border-border">
                <tr>
                  {!isStaff && (
                    <th className="p-3 w-10 text-center">
                      <Checkbox
                        checked={allCurrentSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const discountPct = p.mrpPaise > p.pricePaise
                    ? Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100)
                    : 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-2/50 transition-colors ${
                        isSelected ? 'bg-accent/5' : ''
                      }`}
                    >
                      {!isStaff && (
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOne(p.id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </td>
                      )}

                      {/* Product details */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border/80 bg-white shrink-0 shadow-2xs">
                            {p.image ? (
                              <Image src={p.image} alt={p.name} fill sizes="48px" className="object-contain p-1" />
                            ) : null}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{p.name}</span>
                              {p.tag && (
                                <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                                  {p.tag}
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-fg text-[11px] mt-0.5">
                              {p.unit}
                              {p.subtitle ? ` • ${p.subtitle}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <div className="font-medium text-foreground">{p.categoryName}</div>
                        {p.parentCategoryName && (
                          <div className="text-[11px] text-muted-fg">{p.parentCategoryName}</div>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-semibold text-foreground">
                            {formatINR(p.pricePaise)}
                          </span>
                          {p.mrpPaise > p.pricePaise && (
                            <span className="text-[11px] text-muted-fg line-through">
                              {formatINR(p.mrpPaise)}
                            </span>
                          )}
                        </div>
                        {discountPct > 0 && (
                          <span className="text-[10px] text-success font-medium">
                            {discountPct}% off
                          </span>
                        )}
                      </td>

                      {/* Stock Inline Edit */}
                      <td className="p-3">
                        <StockEditor
                          stock={p.stock}
                          onSave={(newStock) => stockEditMutation.mutate({ id: p.id, stock: newStock })}
                        />
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3">
                        <Switch
                          checked={p.isActive}
                          disabled={isStaff || toggleStatusMutation.isPending}
                          onCheckedChange={(val) => toggleStatusMutation.mutate({ id: p.id, isActive: val })}
                        />
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/products/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit product">
                              <Pencil className="h-3.5 w-3.5 text-muted-fg" />
                            </Button>
                          </Link>

                          {!isStaff && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/10"
                              title="Delete product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {products.map((p) => {
              const discountPct = p.mrpPaise > p.pricePaise
                ? Math.round(((p.mrpPaise - p.pricePaise) / p.mrpPaise) * 100)
                : 0;

              return (
                <Card key={p.id} className="p-3.5 border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-border/80 bg-white shrink-0 shadow-2xs">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill sizes="56px" className="object-contain p-1" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/products/${p.id}`} className="font-semibold text-foreground text-sm truncate">
                          {p.name}
                        </Link>
                        <Switch
                          checked={p.isActive}
                          disabled={isStaff || toggleStatusMutation.isPending}
                          onCheckedChange={(val) => toggleStatusMutation.mutate({ id: p.id, isActive: val })}
                        />
                      </div>

                      <div className="text-xs text-muted-fg mt-0.5">
                        {p.unit} • {p.categoryName}
                      </div>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-semibold text-foreground text-sm">
                          {formatINR(p.pricePaise)}
                        </span>
                        {p.mrpPaise > p.pricePaise && (
                          <span className="text-xs text-muted-fg line-through">
                            {formatINR(p.mrpPaise)}
                          </span>
                        )}
                        {discountPct > 0 && (
                          <span className="text-[10px] text-success font-medium">
                            {discountPct}% off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Link href={`/products/${p.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit product">
                          <Pencil className="h-3.5 w-3.5 text-muted-fg" />
                        </Button>
                      </Link>
                      {!isStaff && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/10"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-fg">Stock:</span>
                      <StockEditor
                        stock={p.stock}
                        onSave={(newStock) => stockEditMutation.mutate({ id: p.id, stock: newStock })}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-2 text-xs text-muted-fg">
            <div>
              Showing {Math.min((page - 1) * meta.pageSize + 1, meta.total)} -{' '}
              {Math.min(page * meta.pageSize, meta.total)} of {meta.total} products
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

      {/* Change Category Bulk Modal */}
      <Dialog open={bulkCategoryModalOpen} onOpenChange={setBulkCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Products to Category</DialogTitle>
            <DialogDescription>
              Select the new destination category for the {selectedIds.length} selected products.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <select
              value={bulkTargetCategoryId}
              onChange={(e) => setBulkTargetCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.children.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({cat.name})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!bulkTargetCategoryId}
              loading={bulkMutation.isPending}
              onClick={() => {
                if (bulkTargetCategoryId) {
                  bulkMutation.mutate({
                    action: 'set_category',
                    categoryId: Number(bulkTargetCategoryId),
                  });
                }
              }}
            >
              Confirm Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? Products with order history cannot be deleted.
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

      {/* CSV Import Modal */}
      <ProductImportDialog open={importModalOpen} onOpenChange={setImportModalOpen} />
    </div>
  );
}

function StockEditor({ stock, onSave }: { stock: number; onSave: (newStock: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stock);

  useEffect(() => {
    setValue(stock);
  }, [stock]);

  const handleCommit = () => {
    const next = Math.max(0, Number(value) || 0);
    setEditing(false);
    if (next !== stock) {
      onSave(next);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommit();
            if (e.key === 'Escape') {
              setValue(stock);
              setEditing(false);
            }
          }}
          autoFocus
          className="w-16 h-7 px-1.5 py-0 text-xs font-mono"
        />
        <Button size="sm" variant="ghost" onClick={handleCommit} className="h-7 w-7 p-0 text-accent">
          <Check className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const isLow = stock > 0 && stock <= 10;
  const isOut = stock === 0;

  return (
    <div
      onClick={() => setEditing(true)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:bg-surface-2 transition-colors border ${
        isOut
          ? 'border-danger/30 text-danger-fg bg-danger/5 font-semibold'
          : isLow
            ? 'border-warning/30 text-warning-fg bg-warning/5 font-semibold'
            : 'border-border text-foreground font-mono'
      }`}
      title="Click to edit stock"
    >
      <span>{stock}</span>
      <span className="text-[10px] text-muted-fg font-normal">units</span>
    </div>
  );
}
