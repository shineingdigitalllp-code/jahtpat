import type { StoreSettingsDto, StoreSettingsInput } from '@jhatpat/shared';
import { db } from '@/config/db';

export async function getStoreSettings(): Promise<StoreSettingsDto> {
  const setting = await db.storeSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: 'Jhatpat',
      phone: null,
      address: null,
      isOpen: true,
      etaMinutes: 10,
      deliveryFeePaise: 2000,
      freeDeliveryAbovePaise: 19900,
      minOrderPaise: 0,
      lowStockThreshold: 10,
    },
    update: {},
  });

  return {
    name: setting.name,
    phone: setting.phone,
    address: setting.address,
    isOpen: setting.isOpen,
    etaMinutes: setting.etaMinutes,
    deliveryFeePaise: setting.deliveryFeePaise,
    freeDeliveryAbovePaise: setting.freeDeliveryAbovePaise,
    minOrderPaise: setting.minOrderPaise,
    lowStockThreshold: setting.lowStockThreshold,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

export async function updateStoreSettings(input: StoreSettingsInput): Promise<StoreSettingsDto> {
  const setting = await db.storeSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      ...input,
    },
    update: {
      ...input,
    },
  });

  return {
    name: setting.name,
    phone: setting.phone,
    address: setting.address,
    isOpen: setting.isOpen,
    etaMinutes: setting.etaMinutes,
    deliveryFeePaise: setting.deliveryFeePaise,
    freeDeliveryAbovePaise: setting.freeDeliveryAbovePaise,
    minOrderPaise: setting.minOrderPaise,
    lowStockThreshold: setting.lowStockThreshold,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

