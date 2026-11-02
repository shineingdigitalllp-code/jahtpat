import { Router } from 'express';
import { adminChangePasswordSchema, adminLoginSchema, adminRegisterSchema } from '@jhatpat/shared';
import { requireAdmin } from '@/middlewares/admin-auth';
import { adminLoginLimiter, adminRegisterLimiter } from '@/middlewares/rate-limit';
import { validate } from '@/middlewares/validate';
import * as controller from './controller';

export const adminAuthRouter = Router();

adminAuthRouter.get('/setup-status', controller.setupStatus);
adminAuthRouter.post('/register', adminRegisterLimiter, validate(adminRegisterSchema), controller.register);
adminAuthRouter.post('/login', adminLoginLimiter, validate(adminLoginSchema), controller.login);
adminAuthRouter.post('/logout', requireAdmin, controller.logout);
adminAuthRouter.get('/me', requireAdmin, controller.me);
adminAuthRouter.post('/change-password', requireAdmin, validate(adminChangePasswordSchema), controller.changePassword);

