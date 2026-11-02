import type { Request, Response } from 'express';
import { couponInputSchema } from '@jhatpat/shared';
import { AppError } from '@/utils/app-error';
import { audit } from '@/utils/audit';
import * as service from './service';

export async function getCoupons(req: Request, res: Response) {
  const coupons = await service.listCoupons();
  res.json({ data: coupons });
}

export async function createCoupon(req: Request, res: Response) {
  const parsed = couponInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid coupon input');
  }

  const coupon = await service.createCoupon(parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'create_coupon', 'coupon', String(coupon.id), { code: coupon.code }, req.ip);
  }

  res.status(201).json({ data: coupon });
}

export async function updateCoupon(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid coupon id');
  }

  const parsed = couponInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid coupon input');
  }

  const coupon = await service.updateCoupon(id, parsed.data);

  if (req.adminId) {
    await audit(req.adminId, 'update_coupon', 'coupon', String(id), { code: coupon.code }, req.ip);
  }

  res.json({ data: coupon });
}

export async function deleteCoupon(req: Request<{ id: string }>, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid coupon id');
  }

  await service.deleteCoupon(id);

  if (req.adminId) {
    await audit(req.adminId, 'delete_coupon', 'coupon', String(id), {}, req.ip);
  }

  res.json({ data: { success: true } });
}

