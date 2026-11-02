import { z } from 'zod';
import { passwordSchema, type User } from './auth';

export type AccountSummary = {
  user: User;
  walletPaise: number;
  addressCount: number;
  orderCount: number;
  hasPassword: boolean;
};

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  email: z
    .union([z.literal(''), z.email('Enter a valid email').trim().toLowerCase()])
    .optional()
    .transform((value) => value || null),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;

export const addressSchema = z.object({
  label: z.enum(ADDRESS_LABELS),
  line1: z.string().trim().min(3, 'Enter house / flat and building').max(120),
  line2: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || null),
  city: z.string().trim().min(2, 'Enter city').max(60),
  state: z.string().trim().min(2, 'Enter state').max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  isDefault: z.boolean().default(false),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type ClaimedCoupon = {
  orderId: string;
  orderCode: string;
  couponCode: string;
  savedPaise: number;
  claimedAt: string;
};

export type WalletData = {
  walletPaise: number;
  totalSavedPaise: number;
  claimed: ClaimedCoupon[];
};
