'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  Clock,
  Coins,
  IndianRupee,
  Layers,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import type { StoreSettingsDto, StoreSettingsInput } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { paiseToRupees, rupeesToPaise } from '@/lib/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import ForbiddenPage from '../forbidden/page';

type SettingsTab = 'store' | 'delivery' | 'inventory';

export default function SettingsPage() {
  const { admin } = useAdmin();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('store');

  const { data: settings, isLoading } = useQuery<StoreSettingsDto>({
    queryKey: ['admin', 'settings'],
    queryFn: () => apiFetch<StoreSettingsDto>('/api/v1/admin/settings'),
    enabled: admin?.role === 'owner',
  });

  // Tab 1: Store profile form state
  const [storeForm, setStoreForm] = React.useState({
    name: '',
    phone: '',
    address: '',
    isOpen: true,
  });

  // Tab 2: Delivery configuration form state (rupees on client)
  const [deliveryForm, setDeliveryForm] = React.useState({
    deliveryFeeRupees: 20,
    freeDeliveryAboveRupees: 199,
    minOrderRupees: 0,
    etaMinutes: 10,
  });

  // Tab 3: Inventory configuration form state
  const [inventoryForm, setInventoryForm] = React.useState({
    lowStockThreshold: 10,
  });

  // Initialize form values from fetched settings
  React.useEffect(() => {
    if (settings) {
      setStoreForm({
        name: settings.name || '',
        phone: settings.phone || '',
        address: settings.address || '',
        isOpen: settings.isOpen,
      });
      setDeliveryForm({
        deliveryFeeRupees: paiseToRupees(settings.deliveryFeePaise),
        freeDeliveryAboveRupees: paiseToRupees(settings.freeDeliveryAbovePaise),
        minOrderRupees: paiseToRupees(settings.minOrderPaise),
        etaMinutes: settings.etaMinutes,
      });
      setInventoryForm({
        lowStockThreshold: settings.lowStockThreshold,
      });
    }
  }, [settings]);

  // Dirty state checks
  const isStoreDirty = React.useMemo(() => {
    if (!settings) return false;
    return (
      storeForm.name !== (settings.name || '') ||
      storeForm.phone !== (settings.phone || '') ||
      storeForm.address !== (settings.address || '') ||
      storeForm.isOpen !== settings.isOpen
    );
  }, [storeForm, settings]);

  const isDeliveryDirty = React.useMemo(() => {
    if (!settings) return false;
    return (
      deliveryForm.deliveryFeeRupees !== paiseToRupees(settings.deliveryFeePaise) ||
      deliveryForm.freeDeliveryAboveRupees !== paiseToRupees(settings.freeDeliveryAbovePaise) ||
      deliveryForm.minOrderRupees !== paiseToRupees(settings.minOrderPaise) ||
      deliveryForm.etaMinutes !== settings.etaMinutes
    );
  }, [deliveryForm, settings]);

  const isInventoryDirty = React.useMemo(() => {
    if (!settings) return false;
    return inventoryForm.lowStockThreshold !== settings.lowStockThreshold;
  }, [inventoryForm, settings]);

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<StoreSettingsInput>) => {
      if (!settings) throw new Error('Settings not loaded');
      const fullPayload: StoreSettingsInput = {
        name: settings.name,
        phone: settings.phone,
        address: settings.address,
        isOpen: settings.isOpen,
        etaMinutes: settings.etaMinutes,
        deliveryFeePaise: settings.deliveryFeePaise,
        freeDeliveryAbovePaise: settings.freeDeliveryAbovePaise,
        minOrderPaise: settings.minOrderPaise,
        lowStockThreshold: settings.lowStockThreshold,
        ...payload,
      };

      return apiFetch<StoreSettingsDto>('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(fullPayload),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin', 'settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Configuration saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update store settings');
    },
  });

  if (admin && admin.role !== 'owner') {
    return <ForbiddenPage />;
  }

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeForm.name.trim().length < 2) {
      toast.error('Store name must be at least 2 characters');
      return;
    }
    saveMutation.mutate({
      name: storeForm.name.trim(),
      phone: storeForm.phone.trim() || null,
      address: storeForm.address.trim() || null,
      isOpen: storeForm.isOpen,
    });
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryForm.deliveryFeeRupees < 0) {
      toast.error('Delivery fee cannot be negative');
      return;
    }
    if (deliveryForm.freeDeliveryAboveRupees < 0) {
      toast.error('Free delivery threshold cannot be negative');
      return;
    }
    if (deliveryForm.etaMinutes < 1) {
      toast.error('Estimated delivery time must be at least 1 minute');
      return;
    }

    saveMutation.mutate({
      deliveryFeePaise: rupeesToPaise(deliveryForm.deliveryFeeRupees),
      freeDeliveryAbovePaise: rupeesToPaise(deliveryForm.freeDeliveryAboveRupees),
      minOrderPaise: rupeesToPaise(deliveryForm.minOrderRupees),
      etaMinutes: Number(deliveryForm.etaMinutes),
    });
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (inventoryForm.lowStockThreshold < 1) {
      toast.error('Low stock threshold must be at least 1 unit');
      return;
    }

    saveMutation.mutate({
      lowStockThreshold: Number(inventoryForm.lowStockThreshold),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Store Settings"
        description="Configure store operations, delivery parameters, and catalog inventory thresholds."
      />

      {/* Tabs Control */}
      <div className="flex items-center gap-1.5 border-b border-border pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'store'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Store Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'delivery'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Delivery & Fees</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Inventory Alerts</span>
        </button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* TAB 1: STORE DETAILS */}
          {activeTab === 'store' && (
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Basic profile shown to customers on the web app and receipt slips.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveStore} className="space-y-4">
                  {/* Store Open / Closed Switch */}
                  <div className="flex items-center justify-between p-3.5 rounded-[10px] border border-border bg-surface-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-ink flex items-center gap-2">
                        <span>Store Accepting Orders</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            storeForm.isOpen ? 'bg-[var(--tone-success-text)]' : 'bg-muted-fg'
                          }`}
                        />
                      </div>
                      <div className="text-[11px] text-muted">
                        When closed, customers cannot place new orders and a notice banner appears.
                      </div>
                    </div>
                    <Switch
                      checked={storeForm.isOpen}
                      onCheckedChange={(checked) =>
                        setStoreForm((prev) => ({ ...prev, isOpen: checked }))
                      }
                      aria-label="Toggle store open status"
                    />
                  </div>

                  {/* Store Name & Phone in 2-column grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Store Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted" />
                        <span>Store Name</span>
                      </label>
                      <Input
                        value={storeForm.name}
                        onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Jhatpat Mart"
                        required
                      />
                    </div>

                    {/* Support Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted" />
                        <span>Support Phone (Optional)</span>
                      </label>
                      <Input
                        value={storeForm.phone}
                        onChange={(e) =>
                          setStoreForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  {/* Store Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted" />
                      <span>Store / Dark Store Location (Optional)</span>
                    </label>
                    <Input
                      value={storeForm.address}
                      onChange={(e) =>
                        setStoreForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="e.g. Shop 4, Phase 2, DLF Cyber City, Gurugram"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={!isStoreDirty || saveMutation.isPending}
                      loading={saveMutation.isPending}
                      className="gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Store Settings</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: DELIVERY & FEES */}
          {activeTab === 'delivery' && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Rates & Delivery Promise</CardTitle>
                <CardDescription>
                  Configure shipping charges and free delivery qualification thresholds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveDelivery} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Delivery Fee */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-muted" />
                        <span>Standard Delivery Fee (₹)</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={deliveryForm.deliveryFeeRupees}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
                            ...prev,
                            deliveryFeeRupees: Number(e.target.value),
                          }))
                        }
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Applied to orders below the free delivery cutoff.
                      </p>
                    </div>

                    {/* Free Delivery Cutoff */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-muted" />
                        <span>Free Delivery Threshold (₹)</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={deliveryForm.freeDeliveryAboveRupees}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
                            ...prev,
                            freeDeliveryAboveRupees: Number(e.target.value),
                          }))
                        }
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Orders above this subtotal qualify for ₹0 delivery.
                      </p>
                    </div>

                    {/* Minimum Order Value */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-muted" />
                        <span>Minimum Order Value (₹)</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={deliveryForm.minOrderRupees}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
                            ...prev,
                            minOrderRupees: Number(e.target.value),
                          }))
                        }
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Minimum checkout total required (0 disables restriction).
                      </p>
                    </div>

                    {/* ETA Minutes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        <span>Estimated Delivery Time (Minutes)</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={deliveryForm.etaMinutes}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
                            ...prev,
                            etaMinutes: Number(e.target.value),
                          }))
                        }
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Displayed in app header and checkout guarantee (e.g. 10 mins).
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={!isDeliveryDirty || saveMutation.isPending}
                      loading={saveMutation.isPending}
                      className="gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Delivery Settings</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: INVENTORY ALERTS */}
          {activeTab === 'inventory' && (
            <Card>
              <CardHeader>
                <CardTitle>Catalog Inventory Controls</CardTitle>
                <CardDescription>
                  Configure global stock alert limits and low-stock indicators.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveInventory} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-muted" />
                        <span>Low Stock Alert Threshold (Units)</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={inventoryForm.lowStockThreshold}
                        onChange={(e) =>
                          setInventoryForm({
                            lowStockThreshold: Number(e.target.value),
                          })
                        }
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Products with inventory at or below this count trigger warnings.
                      </p>
                    </div>

                    <div className="rounded-[8px] bg-surface-2 border border-border p-3 space-y-1 text-xs">
                      <div className="font-semibold text-ink">Threshold Guidelines</div>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Setting this threshold controls the badge counts in the sidebar navigation,
                        the low stock warning indicators in the product catalog table, and dashboard
                        attention queues.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={!isInventoryDirty || saveMutation.isPending}
                      loading={saveMutation.isPending}
                      className="gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Inventory Settings</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

