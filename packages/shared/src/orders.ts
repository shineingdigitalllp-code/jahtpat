import { z } from 'zod';
import type { ProductCard } from './catalog';

export const ORDER_STATUSES = ['pending_payment', 'placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderListQuerySchema = z.object({ tab: z.enum(['ongoing', 'past']).default('ongoing') });
export type OrderTab = z.output<typeof orderListQuerySchema>['tab'];

export type OrderSummary = {
  id: string;
  code: string;
  status: OrderStatus;
  createdAt: string;
  totalPaise: number;
  itemCount: number;
  items: { qty: number; product: ProductCard }[];
  timeline: { placedAt: string; preparingAt: string | null; outForDeliveryAt: string | null; deliveredAt: string | null };
  rider: { name: string; phone: string; etaAt: string | null } | null;
};

export type OrderList = { orders: OrderSummary[]; counts: Record<OrderTab, number> };
