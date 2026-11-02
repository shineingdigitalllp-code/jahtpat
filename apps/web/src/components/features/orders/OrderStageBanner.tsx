import { Bike, ClipboardCheck, ShoppingBag } from "lucide-react";
import type { OrderSummary } from "@jhatpat/shared";

const minutesUntil = (iso: string) => Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000));

export function OrderStageBanner({ order }: { order: OrderSummary }) {
  const eta = order.rider?.etaAt ? `Arriving in about ${minutesUntil(order.rider.etaAt)} min` : "Arriving shortly";
  const stage =
    order.status === "out_for_delivery"
      ? { title: "On the way to you", detail: eta }
      : order.status === "preparing"
        ? { title: "Packing your order", detail: "Picking the freshest items for you" }
        : { title: "Order received", detail: "The store is confirming your order" };

  return (
    <div className="flex items-center gap-3.5 bg-linear-to-r from-primary to-primary-soft px-4 py-3.5">
      <div aria-hidden className="relative grid size-14 shrink-0 place-items-center">
        {order.status === "out_for_delivery" ? (
          <span className="relative grid size-14 place-items-center overflow-hidden rounded-full bg-surface shadow-card">
            <Bike className="size-7 animate-ride text-ink" strokeWidth={1.75} />
            <span className="absolute inset-x-2 bottom-3 h-0.5 animate-road bg-[linear-gradient(90deg,var(--color-ink)_50%,transparent_50%)] bg-size-[1rem_100%] opacity-40" />
          </span>
        ) : order.status === "preparing" ? (
          <>
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-ink/40 [animation-duration:3s]" />
            <span className="grid size-11 place-items-center rounded-full bg-surface shadow-card">
              <ShoppingBag className="size-6 animate-bounce text-ink" strokeWidth={1.75} />
            </span>
          </>
        ) : (
          <>
            <span className="absolute inset-1 animate-pulse-ring rounded-full bg-surface" />
            <span className="relative grid size-12 place-items-center rounded-full bg-surface shadow-card">
              <ClipboardCheck className="size-6 text-ink" strokeWidth={1.75} />
            </span>
          </>
        )}
      </div>
      <div className="min-w-0" aria-live="polite">
        <p className="text-base leading-tight font-extrabold text-ink">{stage.title}</p>
        <p className="mt-0.5 text-xs font-medium text-ink/70">{stage.detail}</p>
      </div>
    </div>
  );
}
