import type { OffersData } from '@jhatpat/shared';
import { db } from '@/config/db';
import { bannerSelect } from '@/modules/catalog/service';

export async function getOffers(): Promise<OffersData> {
  const now = new Date();
  const [banners, coupons] = await Promise.all([
    db.banner.findMany({ where: { isActive: true, placement: 'offers' }, orderBy: { sortOrder: 'asc' }, select: bannerSelect }),
    db.coupon.findMany({
      where: { isActive: true, validFrom: { lte: now }, validTo: { gte: now } },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        title: true,
        subtitle: true,
        image: true,
        category: true,
        type: true,
        value: true,
        minOrderPaise: true,
        maxDiscountPaise: true,
      },
    }),
  ]);
  return { banners, coupons };
}
