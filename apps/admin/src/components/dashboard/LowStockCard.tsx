'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface LowStockItem {
  id: number;
  name: string;
  image: string | null;
  unit: string;
  stock: number;
}

export interface LowStockCardProps {
  items: LowStockItem[];
  className?: string;
}

export function LowStockCard({ items = [], className }: LowStockCardProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [newStock, setNewStock] = React.useState<string>('');

  const restockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      return apiFetch(`/api/v1/admin/products/${id}/quick`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      });
    },
    onSuccess: (_, vars) => {
      toast.success('Stock updated');
      setEditingId(null);
      setNewStock('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update stock');
    },
  });

  const handleSave = (id: number) => {
    const parsed = parseInt(newStock, 10);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid stock number');
      return;
    }
    restockMutation.mutate({ id, stock: parsed });
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-ink">Low Stock Inventory</CardTitle>
        <Link href="/products?stock=low" className="text-xs text-accent hover:underline font-medium">
          View all
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {items.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted">
            All stock levels healthy
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((prod) => {
              const isEditing = editingId === prod.id;
              const isOutOfStock = prod.stock === 0;

              return (
                <div
                  key={prod.id}
                  className={cn(
                    'p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-surface-2/40 transition-colors',
                    isOutOfStock
                      ? 'border-l-2 border-l-rose-500 bg-rose-500/[0.02]'
                      : 'border-l-2 border-l-amber-500 bg-amber-500/[0.02]',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-[6px] border border-border/80 bg-white overflow-hidden shrink-0 flex items-center justify-center text-muted shadow-2xs">
                      {prod.image ? (
                        <Image
                          src={prod.image}
                          alt={prod.name}
                          width={36}
                          height={36}
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-ink truncate">{prod.name}</div>
                      <div className="text-[11px] text-muted">{prod.unit}</div>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(prod.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="h-7 w-16 text-center text-xs p-1 tabular-nums"
                        placeholder="Qty"
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        loading={restockMutation.isPending}
                        onClick={() => handleSave(prod.id)}
                        className="h-7 px-2 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-7 px-1.5 text-xs text-muted"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-[4px]',
                          isOutOfStock
                            ? 'text-[var(--tone-danger-text)] bg-[var(--tone-danger-bg)]'
                            : 'text-[var(--tone-warning-text)] bg-[var(--tone-warning-bg)]',
                        )}
                      >
                        {isOutOfStock ? '0 left' : `${prod.stock} left`}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(prod.id);
                          setNewStock(String(prod.stock + 10));
                        }}
                        className="h-7 px-2 text-xs gap-1"
                        title="Restock product"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Restock</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

