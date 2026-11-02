'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCategoryNode, AdminProductDetail, ProductInput } from '@jhatpat/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { apiFetch } from '@/lib/api-client';
import { formatINR } from '@/lib/format';

interface ProductFormProps {
  initialData?: AdminProductDetail;
}

const UNIT_PRESETS = ['100 g', '250 g', '500 g', '1 kg', '2 kg', '5 kg', '200 ml', '500 ml', '1 L', '1 pc', '6 pcs', '1 pack'];
const TAG_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Fresh', label: 'Fresh' },
  { value: 'Organic', label: 'Organic' },
  { value: 'Bestseller', label: 'Bestseller' },
  { value: 'Popular', label: 'Popular' },
  { value: 'Must Try', label: 'Must Try' },
];

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [unit, setUnit] = useState(initialData?.unit || '500 g');
  const [tag, setTag] = useState<string>(initialData?.tag || '');
  const [categoryId, setCategoryId] = useState<number | ''>(initialData?.categoryId || '');
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [images, setImages] = useState<{ url: string }[]>(
    initialData?.images?.map((img) => ({ url: img.url })) || [],
  );

  // Prices stored in rupees for input
  const [mrpRupees, setMrpRupees] = useState<string>(
    initialData ? String(initialData.mrpPaise / 100) : '',
  );
  const [priceRupees, setPriceRupees] = useState<string>(
    initialData ? String(initialData.pricePaise / 100) : '',
  );
  const [stock, setStock] = useState<string>(
    initialData ? String(initialData.stock) : '20',
  );

  // Categories
  const { data: categories = [] } = useQuery<AdminCategoryNode[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch('/api/v1/admin/categories'),
    staleTime: 60 * 1000,
  });

  // Auto-slug from name on create
  useEffect(() => {
    if (!isEditing && name && !slug) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  }, [name, isEditing, slug]);

  // Derived price stats
  const mrpNum = parseFloat(mrpRupees) || 0;
  const priceNum = parseFloat(priceRupees) || 0;
  const mrpPaise = Math.round(mrpNum * 100);
  const pricePaise = Math.round(priceNum * 100);

  const priceError = priceNum > 0 && mrpNum > 0 && priceNum > mrpNum;
  const savingsPaise = Math.max(0, mrpPaise - pricePaise);
  const discountPct =
    mrpPaise > pricePaise && mrpPaise > 0
      ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100)
      : 0;

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: ProductInput) => {
      if (isEditing) {
        return apiFetch<AdminProductDetail>(`/api/v1/admin/products/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<AdminProductDetail>('/api/v1/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(isEditing ? 'Product updated' : 'Product created', {
        action: {
          label: 'View on store',
          onClick: () => window.open(`/product/${saved.slug}`, '_blank'),
        },
      });
      router.push('/products');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    if (mrpPaise <= 0) {
      toast.error('Please enter a valid MRP');
      return;
    }
    if (pricePaise <= 0) {
      toast.error('Please enter a valid selling price');
      return;
    }
    if (priceError) {
      toast.error('Selling price cannot be greater than MRP');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      slug: slug.trim() || undefined,
      categoryId: Number(categoryId),
      unit: unit.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      tag: tag || null,
      mrpPaise,
      pricePaise,
      stock: Math.max(0, parseInt(stock, 10) || 0),
      isActive,
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button type="button" variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEditing ? `Edit ${initialData.name}` : 'New Product'}
            </h1>
            <p className="text-xs text-muted-fg">
              {isEditing ? 'Update catalog details, pricing, and stock.' : 'Add a new product to your catalog.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <a
              href={`/product/${initialData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button type="button" variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View on store
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-5 border border-border space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-foreground">Product Name *</label>
                <span className="text-[11px] text-muted-fg">{name.length}/120</span>
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 120))}
                placeholder="e.g. Fresh Hybrid Tomatoes"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-foreground">Subtitle / Short Highlight</label>
                <span className="text-[11px] text-muted-fg">{subtitle.length}/80</span>
              </div>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value.slice(0, 80))}
                placeholder="e.g. Crisp, farm fresh and nutrient rich"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-foreground">Description</label>
                <span className="text-[11px] text-muted-fg">{description.length}/2000</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                rows={4}
                placeholder="Detailed description of the product, sourcing, or culinary tips..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </Card>

          {/* Images */}
          <Card className="p-5 border border-border space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Product Images *</h2>
              <p className="text-xs text-muted-fg mt-0.5">
                Upload up to 8 images. The first image will be displayed as the primary photo.
              </p>
            </div>

            <ImageUploader
              value={images}
              onChange={setImages}
              max={8}
              kind="product"
            />
          </Card>

          {/* Pricing & Savings */}
          <Card className="p-5 border border-border space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Pricing & Discount</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  MRP (Maximum Retail Price ₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={mrpRupees}
                  onChange={(e) => setMrpRupees(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Selling Price (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceRupees}
                  onChange={(e) => setPriceRupees(e.target.value)}
                  placeholder="0.00"
                  required
                  className={priceError ? 'border-danger focus:ring-danger' : ''}
                />
                {priceError && (
                  <p className="text-[11px] text-danger-fg mt-1">
                    Selling price cannot exceed MRP
                  </p>
                )}
              </div>
            </div>

            {/* Live calculation banner */}
            {mrpNum > 0 && priceNum > 0 && !priceError && (
              <div className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-fg">Customer saves: </span>
                  <span className="font-semibold text-success">{formatINR(savingsPaise)}</span>
                </div>
                {discountPct > 0 && (
                  <div className="px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold text-[11px]">
                    {discountPct}% OFF
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Inventory & Units */}
          <Card className="p-5 border border-border space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Inventory & Measurement</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Unit / Weight Label *
                </label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. 500 g, 1 kg, 1 pc"
                  required
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {UNIT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setUnit(p)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        unit === p
                          ? 'border-accent bg-accent/10 text-accent font-medium'
                          : 'border-border bg-surface text-muted-fg hover:text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Available Stock (Units) *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  required
                />
                <p className="text-[11px] text-muted-fg mt-1">
                  Low stock threshold alert triggers at 10 or fewer units.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Side Column (1 col) */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-5 border border-border space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground block">Active on Store</span>
                <span className="text-[11px] text-muted-fg">Show in customer catalog</span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </Card>

          {/* Organization */}
          <Card className="p-5 border border-border space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Organization</h2>

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
                <option value="">Select subcategory...</option>
                {categories.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.children.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Badge / Tag
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Slug & Store Preview */}
          <Card className="p-5 border border-border space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Storefront Link</h2>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                URL Slug
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tomato-hybrid-fresh"
              />
            </div>
            <div className="p-2.5 rounded-lg bg-surface-2 border border-border">
              <span className="text-[10px] text-muted-fg block">Storefront URL Preview</span>
              <span className="text-xs font-mono text-accent truncate block mt-0.5">
                /product/{slug || 'product-slug'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/90 backdrop-blur-md border-t border-border p-3 sm:px-8 flex items-center justify-end gap-3">
        <Link href="/products">
          <Button type="button" variant="outline">
            Discard
          </Button>
        </Link>
        <Button
          type="submit"
          loading={saveMutation.isPending}
          disabled={priceError}
        >
          {isEditing ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

