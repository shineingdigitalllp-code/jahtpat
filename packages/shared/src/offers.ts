import type { Banner } from './catalog';

export const COUPON_CATEGORIES = ['general', 'bank', 'wallet', 'combo'] as const;
export type CouponCategory = (typeof COUPON_CATEGORIES)[number];

export const COUPON_TYPES = ['flat', 'percent', 'free_delivery'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export type Coupon = {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  image: string;
  category: CouponCategory;
  type: CouponType;
  value: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
};

export type OffersData = { banners: Banner[]; coupons: Coupon[] };
