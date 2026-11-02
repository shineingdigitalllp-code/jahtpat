"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { OrderSummary } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart-store";

export function BuyAgainButton({ items }: { items: OrderSummary["items"] }) {
  const [added, setAdded] = useState(false);

  const buyAgain = () => {
    const { lines, setQty } = useCartStore.getState();
    for (const { product, qty } of items) setQty(product, (lines[product.id]?.qty ?? 0) + qty);
    setAdded(true);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={buyAgain}
      disabled={added}
      className="h-10 flex-1 rounded-xl border-primary-strong text-ink shadow-none"
    >
      {added ? <Check aria-hidden className="size-4" /> : <RotateCcw aria-hidden className="size-4" />}
      {added ? "Added to cart" : "Buy Again"}
    </Button>
  );
}
