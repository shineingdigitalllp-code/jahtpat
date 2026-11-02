import { Router, type Request, type Response } from 'express';
import { db } from '@/config/db';

export const storeRouter = Router();

storeRouter.get('/store', async (_req: Request, res: Response) => {
  const setting = await db.storeSetting.findUnique({
    where: { id: 1 },
    select: {
      name: true,
      isOpen: true,
      etaMinutes: true,
      deliveryFeePaise: true,
      freeDeliveryAbovePaise: true,
      minOrderPaise: true,
    },
  });

  const data = setting ?? {
    name: 'Jhatpat',
    isOpen: true,
    etaMinutes: 10,
    deliveryFeePaise: 2000,
    freeDeliveryAbovePaise: 19900,
    minOrderPaise: 0,
  };

  res.json({ data });
});

