import Image from "next/image";
import type { OrderSummary } from "@jhatpat/shared";
import { formatINR, formatOrderDate } from "@/lib/format";
import { BuyAgainButton } from "./BuyAgainButton";
import { OrderStageBanner } from "./OrderStageBanner";
import { OrderStatusPill } from "./OrderStatusPill";
import { OrderTracker } from "./OrderTracker";

const THUMBNAILS = 4;
const ONGOING = new Set(["placed", "preparing", "out_for_delivery"]);

export function OrderCard({ order }: { order: OrderSummary }) {
  const ongoing = ONGOING.has(order.status);
  const extra = order.items.length - THUMBNAILS;

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card">
      {ongoing && <OrderStageBanner order={order} />}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[0.9375rem] font-bold text-ink">Order #{order.code}</h2>
            <p className="text-xs text-muted">{formatOrderDate(order.createdAt)}</p>
          </div>
          {!ongoing && <OrderStatusPill status={order.status} />}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <ul className="flex min-w-0 flex-1 -space-x-2">
            {order.items.slice(0, THUMBNAILS).map(({ product }) => (
              <li key={product.id} className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-canvas/60 border border-border/40 ring-2 ring-surface">
                {product.image && <Image src={product.image} alt={product.name} fill sizes="3rem" className="object-contain p-0.5" />}
              </li>
            ))}
            {extra > 0 && (
              <li className="grid size-12 shrink-0 place-items-center rounded-xl bg-canvas text-xs font-bold text-ink ring-2 ring-surface">
                +{extra}
              </li>
            )}
          </ul>
          <p className="shrink-0 text-right leading-tight">
            <span className="block text-base font-extrabold text-ink">{formatINR(order.totalPaise)}</span>
            <span className="text-xs text-muted">{order.itemCount} items</span>
          </p>
        </div>

        {ongoing ? (
          <div className="mt-4 border-t border-dashed pt-4">
            <OrderTracker timeline={order.timeline} />
          </div>
        ) : (
          order.status === "delivered" && (
            <div className="mt-4 flex">
              <BuyAgainButton items={order.items} />
            </div>
          )
        )}
      </div>
    </article>
  );
}
