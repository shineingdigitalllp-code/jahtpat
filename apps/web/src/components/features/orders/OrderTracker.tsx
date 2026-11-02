import type { OrderSummary } from "@jhatpat/shared";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderTracker({ timeline }: { timeline: OrderSummary["timeline"] }) {
  const steps = [
    { label: "Placed", at: timeline.placedAt },
    { label: "Packing", at: timeline.preparingAt },
    { label: "On the way", at: timeline.outForDeliveryAt },
    { label: "Delivered", at: timeline.deliveredAt },
  ];
  const active = steps.findIndex((step) => !step.at);

  return (
    <ol aria-label="Order progress" className="grid grid-cols-4 gap-1.5">
      {steps.map((step, index) => {
        const done = Boolean(step.at);
        const current = index === active;
        return (
          <li key={step.label} aria-current={current ? "step" : undefined}>
            <span aria-hidden className="relative block h-1.5 overflow-hidden rounded-full bg-border">
              {done && <span className="absolute inset-0 rounded-full bg-ink" />}
              {current && <span className="absolute inset-y-0 w-2/5 animate-shimmer rounded-full bg-primary-strong" />}
            </span>
            <span className={cn("mt-2 block text-[0.6875rem] leading-tight", done || current ? "font-bold text-ink" : "text-muted")}>
              {step.label}
            </span>
            <span className="block text-[0.625rem] text-muted">
              {step.at ? formatTime(step.at) : current ? "In progress" : " "}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
