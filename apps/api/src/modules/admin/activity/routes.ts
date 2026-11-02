import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminActivityRouter = Router();

adminActivityRouter.use(requireAdmin, requireRole('owner', 'manager'));

adminActivityRouter.get('/', controller.getActivity);

