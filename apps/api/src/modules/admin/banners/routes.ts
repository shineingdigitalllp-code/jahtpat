import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminBannersRouter = Router();

adminBannersRouter.get('/', requireAdmin, requireRole('owner', 'manager'), controller.getBanners);
adminBannersRouter.post('/', requireAdmin, requireRole('owner', 'manager'), controller.createBanner);
adminBannersRouter.put('/:id', requireAdmin, requireRole('owner', 'manager'), controller.updateBanner);
adminBannersRouter.patch('/reorder', requireAdmin, requireRole('owner', 'manager'), controller.reorderBanners);
adminBannersRouter.delete('/:id', requireAdmin, requireRole('owner', 'manager'), controller.deleteBanner);

