import { z } from 'zod';
import type { Coupon } from './offers';

export const PRODUCT_SORTS = ['popular', 'price_asc', 'price_desc', 'rating'] as const;

export const productQuerySchema = z.object({
  category: z.string().max(80).optional(),
  q: z.string().trim().max(60).optional(),
  sort: z.enum(PRODUCT_SORTS).default('popular'),
  tag: z.string().max(30).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});

export type ProductSort = (typeof PRODUCT_SORTS)[number];
export type ProductQuery = z.input<typeof productQuerySchema>;
export type ProductFilters = z.output<typeof productQuerySchema>;

export type Category = { id: number; name: string; slug: string; image: string };

export type Banner = {
  id: number;
  title: string;
  subtitle: string;
  ctaLabel: string;
  image: string;
  link: string;
};

export type ProductCard = {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  unit: string;
  tag: string | null;
  ratingAvg: number;
  ratingCount: number;
  pricePaise: number;
  mrpPaise: number;
  image: string | null;
};

export type HomeData = {
  banners: Banner[];
  categories: Category[];
  deals: ProductCard[];
  bestSellers: (Category & { parentSlug: string })[];
  topRated: ProductCard[];
  freshPicks: ProductCard[];
  coupons: Coupon[];
};

export type CategoryDetail = {
  category: Category;
  children: Category[];
  banner: Banner | null;
};

export type ProductPage = { items: ProductCard[]; nextCursor: number | null };

export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  unit: string;
  tag: string | null;
  ratingAvg: number;
  ratingCount: number;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  images: string[];
  category: { id: number; name: string; slug: string };
  similarProducts: ProductCard[];
};
