import { Router } from 'express';
import { requireAdmin, requireRole } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdmin, requireRole('owner'));

adminSettingsRouter.get('/', controller.getSettings);
adminSettingsRouter.put('/', controller.updateSettings);

