import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import { adminActivityRouter } from './activity/routes';
import { adminAuthRouter } from './auth/routes';
import { adminBannersRouter } from './banners/routes';
import { adminCategoriesRouter } from './categories/routes';
import { adminCouponsRouter } from './coupons/routes';
import { getCounts } from './counts/controller';
import { adminCustomersRouter } from './customers/routes';
import { getDashboard } from './dashboard/controller';
import * as orderController from './orders/controller';
import { adminPaymentsRouter } from './payments/routes';
import { adminProductsRouter } from './products/routes';
import { adminSearchRouter } from './search/routes';
import { adminSettingsRouter } from './settings/routes';
import { adminTeamRouter } from './team/routes';
import { adminUploadsRouter } from './uploads/routes';
import adminAnalyticsRouter from './analytics/routes';

export const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);
adminRouter.get('/counts', requireAdmin, getCounts);
adminRouter.get('/dashboard', requireAdmin, getDashboard);
adminRouter.use('/search', adminSearchRouter);

// Orders module
adminRouter.get('/orders', requireAdmin, orderController.getOrders);
adminRouter.get('/orders/export.csv', requireAdmin, requireRole('owner', 'manager'), orderController.exportCsv);
adminRouter.get('/orders/:code', requireAdmin, orderController.getDetail);
adminRouter.patch('/orders/:code/status', requireAdmin, orderController.updateStatus);
adminRouter.patch('/orders/:code/delivery', requireAdmin, orderController.updateDelivery);
adminRouter.patch('/orders/:code/note', requireAdmin, orderController.updateNote);

// Catalog modules
adminRouter.use('/uploads', adminUploadsRouter);
adminRouter.use('/categories', adminCategoriesRouter);
adminRouter.use('/products', adminProductsRouter);

// Sales modules (Customers & Payments)
adminRouter.use('/customers', adminCustomersRouter);
adminRouter.use('/payments', adminPaymentsRouter);

// Marketing modules (Coupons & Banners)
adminRouter.use('/coupons', adminCouponsRouter);
adminRouter.use('/banners', adminBannersRouter);

// System modules (Team, Settings, Activity, Analytics)
adminRouter.use('/team', adminTeamRouter);
adminRouter.use('/settings', adminSettingsRouter);
adminRouter.use('/activity', adminActivityRouter);
adminRouter.use('/analytics', adminAnalyticsRouter);
