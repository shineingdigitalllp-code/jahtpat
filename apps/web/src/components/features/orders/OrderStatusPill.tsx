import { CircleCheck, Clock, Truck, XCircle, type LucideIcon } from "lucide-react";
import type { OrderStatus } from "@jhatpat/shared";
import { cn } from "@/lib/utils";

const STATUS: Record<OrderStatus, { label: string; icon: LucideIcon; className: string }> = {
  pending_payment: { label: "Payment pending", icon: Clock, className: "bg-danger-soft text-danger" },
  placed: { label: "Order placed", icon: Clock, className: "bg-primary-soft text-ink" },
  preparing: { label: "Packing", icon: Clock, className: "bg-primary-soft text-ink" },
  out_for_delivery: { label: "On the way", icon: Truck, className: "bg-primary-soft text-ink" },
  delivered: { label: "Delivered", icon: CircleCheck, className: "bg-positive-soft text-positive" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-danger-soft text-danger" },
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const { label, icon: Icon, className } = STATUS[status];

  return (
    <span className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", className)}>
      <Icon aria-hidden className="size-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}
