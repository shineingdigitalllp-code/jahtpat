import { z } from 'zod';

export const bannerInputSchema = z.object({
  placement: z.enum(['home', 'offers']).default('home'),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(60),
  subtitle: z.string().trim().max(120).default(''),
  ctaLabel: z.string().trim().max(20).default('Shop Now'),
  image: z.string().min(1, 'Banner image is required'),
  link: z
    .string()
    .trim()
    .refine((l) => l.startsWith('/'), 'Link must start with / (e.g. /category/fruits-vegetables)'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type BannerInput = z.infer<typeof bannerInputSchema>;

export const reorderBannerSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int(),
      sortOrder: z.number().int(),
    }),
  ),
});

export type ReorderBannerInput = z.infer<typeof reorderBannerSchema>;

export interface AdminBannerListItem {
  id: number;
  placement: 'home' | 'offers';
  categoryId: number | null;
  categoryName: string | null;
  title: string;
  subtitle: string;
  ctaLabel: string;
  image: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
}

