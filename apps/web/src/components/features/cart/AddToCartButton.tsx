"use client";

import { Plus } from "lucide-react";
import type { ProductCard } from "@jhatpat/shared";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { MAX_QTY_PER_ITEM, useCartQty, useCartStore } from "@/store/cart-store";

export function AddToCartButton({ product }: { product: ProductCard }) {
  const qty = useCartQty(product.id);
  const setQty = useCartStore((state) => state.setQty);

  if (qty > 0) {
    return (
      <div className="relative z-10">
        <QtyStepper
          size="xs"
          min={0}
          max={MAX_QTY_PER_ITEM}
          value={qty}
          onChange={(value) => setQty(product, value)}
          label={`${product.name} quantity`}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setQty(product, 1)}
      aria-label={`Add ${product.name} to cart`}
      className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-black shadow-cta transition duration-150 ease-out after:absolute after:-inset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-90"
    >
      <Plus aria-hidden className="size-4" strokeWidth={3} />
    </button>
  );
}
