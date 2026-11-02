import { Router, type Request } from 'express';
import { addressSchema } from '@jhatpat/shared';
import { requireAuth } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import { createAddress, deleteAddress, listAddresses, setDefaultAddress, updateAddress } from './service';

type IdRequest = Request<{ id: string }>;

export const addressesRouter = Router();

addressesRouter.use('/addresses', requireAuth);

addressesRouter.get('/addresses', async (req, res) => {
  res.json({ data: await listAddresses(req.userId!) });
});

addressesRouter.post('/addresses', validate(addressSchema), async (req, res) => {
  res.status(201).json({ data: await createAddress(req.userId!, req.body) });
});

addressesRouter.put('/addresses/:id', validate(addressSchema), async (req: IdRequest, res) => {
  res.json({ data: await updateAddress(req.userId!, req.params.id, req.body) });
});

addressesRouter.post('/addresses/:id/default', async (req: IdRequest, res) => {
  await setDefaultAddress(req.userId!, req.params.id);
  res.json({ data: { ok: true } });
});

addressesRouter.delete('/addresses/:id', async (req: IdRequest, res) => {
  await deleteAddress(req.userId!, req.params.id);
  res.json({ data: { ok: true } });
});
