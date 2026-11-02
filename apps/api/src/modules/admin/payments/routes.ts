import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminPaymentsRouter = Router();

adminPaymentsRouter.get('/', requireAdmin, requireRole('owner', 'manager'), controller.getPayments);
adminPaymentsRouter.patch('/:code/mark-paid', requireAdmin, requireRole('owner', 'manager'), controller.markPaid);
adminPaymentsRouter.post('/:code/refund', requireAdmin, requireRole('owner', 'manager'), controller.refund);

