import { z } from 'zod';

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Code must be at least 2 characters')
      .max(30)
      .transform((c) => c.toUpperCase()),
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(40),
    subtitle: z.string().trim().max(60).default(''),
    image: z.string().min(1, 'Coupon image is required'),
    category: z.enum(['general', 'bank', 'wallet', 'combo']).default('general'),
    type: z.enum(['flat', 'percent', 'free_delivery']),
    value: z.coerce.number().int().min(0, 'Value must be at least 0'),
    minOrderPaise: z.coerce.number().int().min(0).default(0),
    maxDiscountPaise: z.coerce.number().int().positive().nullable().optional(),
    validFrom: z.string().min(1, 'Valid from date required'),
    validTo: z.string().min(1, 'Valid to date required'),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine(
    (data) => {
      const from = new Date(data.validFrom).getTime();
      const to = new Date(data.validTo).getTime();
      return to > from;
    },
    {
      message: 'End date must be after start date',
      path: ['validTo'],
    },
  )
  .refine(
    (data) => {
      if (data.type === 'percent') {
        return data.value >= 1 && data.value <= 100;
      }
      if (data.type === 'flat') {
        return data.value > 0;
      }
      return true;
    },
    {
      message: 'Percent discount must be between 1 and 100, flat discount must be greater than 0',
      path: ['value'],
    },
  );

export type CouponInput = z.infer<typeof couponInputSchema>;

export interface AdminCouponListItem {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  image: string;
  category: 'general' | 'bank' | 'wallet' | 'combo';
  type: 'flat' | 'percent' | 'free_delivery';
  value: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  sortOrder: number;
  usedCount: number;
  status: 'active' | 'scheduled' | 'expired' | 'inactive';
  ruleSummary: string;
}

