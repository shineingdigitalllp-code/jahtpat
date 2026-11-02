import { Router } from 'express';
import { changePasswordSchema, profileSchema } from '@jhatpat/shared';
import { requireAuth } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rate-limit';
import { validate } from '@/middlewares/validate';
import { changePassword, getSummary, getWallet, updateProfile } from './service';

export const accountRouter = Router();

accountRouter.use('/account', requireAuth);

accountRouter.get('/account/summary', async (req, res) => {
  res.json({ data: await getSummary(req.userId!) });
});

accountRouter.get('/account/wallet', async (req, res) => {
  res.json({ data: await getWallet(req.userId!) });
});

accountRouter.patch('/account/profile', validate(profileSchema), async (req, res) => {
  res.json({ data: await updateProfile(req.userId!, req.body) });
});

accountRouter.post('/account/password', authLimiter, validate(changePasswordSchema), async (req, res) => {
  await changePassword(req.userId!, req.body);
  res.json({ data: { ok: true } });
});
