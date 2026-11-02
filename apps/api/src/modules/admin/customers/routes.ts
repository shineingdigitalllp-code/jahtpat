import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminCustomersRouter = Router();

adminCustomersRouter.get('/', requireAdmin, controller.getCustomers);
adminCustomersRouter.get('/:id', requireAdmin, controller.getCustomer);
adminCustomersRouter.patch('/:id/block', requireAdmin, requireRole('owner', 'manager'), controller.blockCustomer);
adminCustomersRouter.post('/:id/wallet', requireAdmin, requireRole('owner', 'manager'), controller.adjustWallet);

