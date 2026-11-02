"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart-store";

export function ApplyCouponButton({ code }: { code: string }) {
  const applied = useCartStore((state) => state.couponCode === code);
  const setCoupon = useCartStore((state) => state.setCoupon);

  return (
    <Button
      size="sm"
      variant={applied ? "outline" : "primary"}
      aria-pressed={applied}
      onClick={() => setCoupon(applied ? null : code)}
      className={applied ? "h-8 border-neutral-300 bg-neutral-100 px-3 text-xs font-bold text-neutral-900" : "h-8 px-4 text-xs font-bold"}
    >
      {applied && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
      {applied ? "Applied" : "Apply"}
    </Button>
  );
}
