import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminCouponsRouter = Router();

adminCouponsRouter.get('/', requireAdmin, requireRole('owner', 'manager'), controller.getCoupons);
adminCouponsRouter.post('/', requireAdmin, requireRole('owner', 'manager'), controller.createCoupon);
adminCouponsRouter.put('/:id', requireAdmin, requireRole('owner', 'manager'), controller.updateCoupon);
adminCouponsRouter.delete('/:id', requireAdmin, requireRole('owner', 'manager'), controller.deleteCoupon);

