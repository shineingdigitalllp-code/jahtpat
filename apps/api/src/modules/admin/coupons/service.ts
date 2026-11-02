import type { AdminCouponListItem, CouponInput } from '@jhatpat/shared';
import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';

function generateRuleSummary(c: {
  type: string;
  value: number;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
}): string {
  const minText = c.minOrderPaise > 0 ? ` above ₹${c.minOrderPaise / 100}` : '';

  if (c.type === 'percent') {
    const maxText = c.maxDiscountPaise ? `, up to ₹${c.maxDiscountPaise / 100}` : '';
    return `${c.value}% off${maxText}${minText}`;
  }

  if (c.type === 'flat') {
    return `₹${c.value / 100} off${minText}`;
  }

  if (c.type === 'free_delivery') {
    return `Free delivery${minText}`;
  }

  return 'Discount applied';
}

export async function listCoupons(): Promise<AdminCouponListItem[]> {
  const coupons = await db.coupon.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  const now = new Date();

  // Fetch usage counts for each coupon
  const items: AdminCouponListItem[] = await Promise.all(
    coupons.map(async (c) => {
      const usedCount = await db.order.count({
        where: {
          couponCode: c.code,
          status: { not: 'cancelled' },
        },
      });

      let status: 'active' | 'scheduled' | 'expired' | 'inactive' = 'active';
      if (!c.isActive) {
        status = 'inactive';
      } else if (now < c.validFrom) {
        status = 'scheduled';
      } else if (now > c.validTo) {
        status = 'expired';
      }

      const ruleSummary = generateRuleSummary({
        type: c.type,
        value: c.value,
        minOrderPaise: c.minOrderPaise,
        maxDiscountPaise: c.maxDiscountPaise,
      });

      return {
        id: c.id,
        code: c.code,
        title: c.title,
        subtitle: c.subtitle,
        image: c.image,
        category: c.category as any,
        type: c.type as any,
        value: c.value,
        minOrderPaise: c.minOrderPaise,
        maxDiscountPaise: c.maxDiscountPaise,
        validFrom: c.validFrom.toISOString(),
        validTo: c.validTo.toISOString(),
        isActive: c.isActive,
        sortOrder: c.sortOrder,
        usedCount,
        status,
        ruleSummary,
      };
    }),
  );

  return items;
}

export async function createCoupon(input: CouponInput) {
  const existing = await db.coupon.findUnique({
    where: { code: input.code },
  });
  if (existing) {
    throw new AppError(409, 'CODE_EXISTS', 'A coupon with this code already exists');
  }

  const coupon = await db.coupon.create({
    data: {
      code: input.code,
      title: input.title,
      subtitle: input.subtitle,
      image: input.image,
      category: input.category,
      type: input.type,
      value: input.value,
      minOrderPaise: input.minOrderPaise,
      maxDiscountPaise: input.maxDiscountPaise ?? null,
      validFrom: new Date(input.validFrom),
      validTo: new Date(input.validTo),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });

  return coupon;
}

export async function updateCoupon(id: number, input: CouponInput) {
  const existing = await db.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Coupon not found');
  }

  if (input.code !== existing.code) {
    const codeConflict = await db.coupon.findUnique({ where: { code: input.code } });
    if (codeConflict) {
      throw new AppError(409, 'CODE_EXISTS', 'A coupon with this code already exists');
    }
  }

  const updated = await db.coupon.update({
    where: { id },
    data: {
      code: input.code,
      title: input.title,
      subtitle: input.subtitle,
      image: input.image,
      category: input.category,
      type: input.type,
      value: input.value,
      minOrderPaise: input.minOrderPaise,
      maxDiscountPaise: input.maxDiscountPaise ?? null,
      validFrom: new Date(input.validFrom),
      validTo: new Date(input.validTo),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });

  return updated;
}

export async function deleteCoupon(id: number) {
  const existing = await db.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Coupon not found');
  }

  const usedCount = await db.order.count({
    where: {
      couponCode: existing.code,
      status: { not: 'cancelled' },
    },
  });

  if (usedCount > 0) {
    throw new AppError(
      409,
      'COUPON_IN_USE',
      'Cannot delete coupon that has already been used in orders. Deactivate it instead.',
    );
  }

  await db.coupon.delete({ where: { id } });
  return { success: true };
}

