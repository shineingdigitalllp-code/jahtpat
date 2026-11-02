import type { Request, Response } from 'express';
import { db } from '@/config/db';

export async function getCounts(req: Request, res: Response) {
  const storeSetting = await db.storeSetting.findUnique({
    where: { id: 1 },
    select: { lowStockThreshold: true },
  });

  const lowStockThreshold = storeSetting?.lowStockThreshold ?? 10;

  const [newOrders, activeOrders, lowStock, pendingAdmins] = await Promise.all([
    db.order.count({
      where: { status: 'placed' },
    }),
    db.order.count({
      where: { status: { in: ['placed', 'preparing', 'out_for_delivery'] } },
    }),
    db.product.count({
      where: {
        isActive: true,
        stock: { lte: lowStockThreshold },
      },
    }),
    req.admin?.role === 'owner'
      ? db.adminUser.count({ where: { status: 'pending' } })
      : Promise.resolve(0),
  ]);

  res.json({
    data: {
      newOrders,
      activeOrders,
      lowStock,
      pendingAdmins,
    },
  });
}

