import type { OrderList, OrderStatus, OrderTab } from '@jhatpat/shared';
import { db } from '@/config/db';
import { productSelect, toCard } from '@/modules/catalog/service';

const ONGOING: OrderStatus[] = ['placed', 'preparing', 'out_for_delivery'];
const PAST: OrderStatus[] = ['delivered', 'cancelled'];

export async function listOrders(userId: string, tab: OrderTab): Promise<OrderList> {
  const [orders, ongoing, past] = await Promise.all([
    db.order.findMany({
      where: { userId, status: { in: tab === 'ongoing' ? ONGOING : PAST } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { items: { select: { qty: true, product: { select: productSelect } } } },
    }),
    db.order.count({ where: { userId, status: { in: ONGOING } } }),
    db.order.count({ where: { userId, status: { in: PAST } } }),
  ]);

  return {
    counts: { ongoing, past },
    orders: orders.map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      totalPaise: order.totalPaise,
      itemCount: order.items.reduce((count, item) => count + item.qty, 0),
      items: order.items.map((item) => ({ qty: item.qty, product: toCard(item.product) })),
      timeline: {
        placedAt: order.createdAt.toISOString(),
        preparingAt: order.preparingAt?.toISOString() ?? null,
        outForDeliveryAt: order.outForDeliveryAt?.toISOString() ?? null,
        deliveredAt: order.deliveredAt?.toISOString() ?? null,
      },
      rider:
        order.riderName && order.riderPhone
          ? { name: order.riderName, phone: order.riderPhone, etaAt: order.etaAt?.toISOString() ?? null }
          : null,
    })),
  };
}
