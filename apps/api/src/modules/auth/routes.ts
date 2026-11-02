import { Router } from 'express';
import { googleAuthSchema, loginSchema, registerSchema } from '@jhatpat/shared';
import { requireAuth } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rate-limit';
import { validate } from '@/middlewares/validate';
import * as controller from './controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), controller.register);
authRouter.post('/login', authLimiter, validate(loginSchema), controller.login);
authRouter.post('/google', authLimiter, validate(googleAuthSchema), controller.google);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, controller.me);
