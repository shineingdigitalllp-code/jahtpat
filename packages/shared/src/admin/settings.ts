import { z } from 'zod';

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(15).nullable().optional(),
  address: z.string().trim().max(191).nullable().optional(),
  isOpen: z.boolean().default(true),
  etaMinutes: z.coerce.number().int().positive('ETA must be positive').default(10),
  deliveryFeePaise: z.coerce.number().int().min(0, 'Delivery fee cannot be negative'),
  freeDeliveryAbovePaise: z.coerce.number().int().min(0, 'Free delivery threshold cannot be negative'),
  minOrderPaise: z.coerce.number().int().min(0, 'Minimum order cannot be negative').default(0),
  lowStockThreshold: z.coerce.number().int().min(1, 'Threshold must be at least 1').default(10),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export interface StoreSettingsDto {
  name: string;
  phone: string | null;
  address: string | null;
  isOpen: boolean;
  etaMinutes: number;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface PublicStoreDto {
  name: string;
  isOpen: boolean;
  etaMinutes: number;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  minOrderPaise: number;
}

