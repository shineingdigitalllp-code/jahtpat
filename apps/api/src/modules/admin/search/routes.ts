import { Router } from 'express';
import { requireAdmin } from '@/middlewares/admin-auth';
import * as controller from './controller';

export const adminSearchRouter = Router();

adminSearchRouter.get('/', requireAdmin, controller.search);

