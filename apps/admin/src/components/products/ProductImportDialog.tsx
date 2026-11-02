'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  UploadCloud,
  X,
} from 'lucide-react';
import type {
  ProductImportCommitInput,
  ProductImportPreviewResponse,
} from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [csvContent, setCsvContent] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [previewData, setPreviewData] = React.useState<ProductImportPreviewResponse | null>(null);

  // Mutation to preview CSV
  const previewMutation = useMutation({
    mutationFn: (csv: string) =>
      apiFetch<ProductImportPreviewResponse>('/api/v1/admin/products/import/preview', {
        method: 'POST',
        body: JSON.stringify({ csv }),
      }),
    onSuccess: (data) => {
      setPreviewData(data);
      if (data.invalidCount > 0) {
        toast.warning(
          `${data.validCount} valid products ready. Found ${data.invalidCount} rows with issues.`,
        );
      } else {
        toast.success(`All ${data.validCount} products validated successfully`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to parse CSV file');
      resetUpload();
    },
  });

  // Mutation to commit import
  const commitMutation = useMutation({
    mutationFn: (items: ProductImportCommitInput['items']) =>
      apiFetch<{ count: number }>('/api/v1/admin/products/import/commit', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      toast.success(`Imported ${data.count} products into catalog`);
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to commit product import');
    },
  });

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Only .csv files are supported');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCsvContent(text);
        previewMutation.mutate(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const resetUpload = () => {
    setCsvContent(null);
    setFileName(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetUpload();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    window.location.href = '/api/v1/admin/products/import/template';
  };

  const handleCommit = () => {
    if (!previewData || previewData.validCount === 0) return;
    const items = previewData.validItems.map((v) => ({
      name: v.name,
      slug: v.slug,
      unit: v.unit,
      subtitle: v.subtitle,
      description: v.description,
      tag: v.tag,
      mrpPaise: v.mrpPaise,
      pricePaise: v.pricePaise,
      stock: v.stock,
      categoryId: v.categoryId,
    }));
    commitMutation.mutate(items);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            <span>Import Products from CSV</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a structured CSV spreadsheet to batch add products to your catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!previewData ? (
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-accent hover:bg-surface-2/40 transition-colors rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer text-center"
              >
                <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Click to select or drag and drop CSV file
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Standard comma-separated format (.csv) up to 5MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />
              </div>

              {/* Template Download Option */}
              <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-surface-2 border border-border">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-ink">Need a sample file?</div>
                  <div className="text-[11px] text-muted">
                    Download our pre-formatted CSV template with required column headers.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="gap-1.5 h-8 text-xs shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Template</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info & Summary Chips */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[10px] bg-surface-2 border border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-xs font-medium text-ink truncate">{fileName}</span>
                  <span className="text-[11px] text-muted shrink-0">
                    ({previewData.totalRows} rows)
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tone-success-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--tone-success-text)]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{previewData.validCount} Valid</span>
                  </span>
                  {previewData.invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tone-danger-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--tone-danger-text)]">
                      <AlertCircle className="h-3 w-3" />
                      <span>{previewData.invalidCount} Issues</span>
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="h-7 px-2 text-xs text-muted hover:text-ink ml-1"
                  >
                    Change file
                  </Button>
                </div>
              </div>

              {/* Invalid Rows Alert & Details */}
              {previewData.invalidCount > 0 && (
                <div className="rounded-[10px] border border-[var(--tone-danger-text)]/30 bg-[var(--tone-danger-bg)]/20 p-3 space-y-2">
                  <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-[var(--tone-danger-text)]" />
                    <span>Rows with validation issues will be skipped:</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-border/40 text-[11px]">
                    {previewData.invalidItems.map((inv, idx) => (
                      <div key={idx} className="pt-1 first:pt-0 flex items-start gap-2">
                        <span className="font-mono text-muted shrink-0">Row {inv.rowNumber}:</span>
                        <span className="text-ink truncate font-medium">
                          {inv.data.name || 'Unnamed Product'}
                        </span>
                        <span className="text-[var(--tone-danger-text)] ml-auto text-right">
                          {inv.errors.join('; ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Items Table Preview */}
              {previewData.validCount > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-ink">
                    Ready to Import ({previewData.validCount} items)
                  </div>
                  <div className="border border-border rounded-[10px] overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-2 text-muted border-b border-border sticky top-0">
                        <tr>
                          <th className="py-2 px-3 font-medium">Product</th>
                          <th className="py-2 px-3 font-medium">Category</th>
                          <th className="py-2 px-3 font-medium">Price</th>
                          <th className="py-2 px-3 font-medium">MRP</th>
                          <th className="py-2 px-3 font-medium">Stock</th>
                          <th className="py-2 px-3 font-medium">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData.validItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-2/40">
                            <td className="py-2 px-3 font-medium text-ink max-w-[160px] truncate">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-muted max-w-[120px] truncate">
                              {item.categoryName}
                            </td>
                            <td className="py-2 px-3 font-semibold text-ink">
                              ₹{item.priceRupees}
                            </td>
                            <td className="py-2 px-3 text-muted">₹{item.mrpRupees}</td>
                            <td className="py-2 px-3 text-ink">{item.stock}</td>
                            <td className="py-2 px-3 text-muted">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>

          {previewData && (
            <Button
              size="sm"
              disabled={previewData.validCount === 0 || commitMutation.isPending}
              loading={commitMutation.isPending}
              onClick={handleCommit}
            >
              Commit Import ({previewData.validCount} items)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

