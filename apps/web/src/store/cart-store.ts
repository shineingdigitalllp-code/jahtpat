import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductCard } from "@jhatpat/shared";

export const MAX_QTY_PER_ITEM = 20;

export type CartLine = { product: ProductCard; qty: number };

export type CartState = {
  lines: Record<number, CartLine>;
  couponCode: string | null;
  setQty: (product: ProductCard, qty: number) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: {},
      couponCode: null,
      setCoupon: (couponCode) => set({ couponCode }),
      clear: () => set({ lines: {}, couponCode: null }),
      setQty: (product, qty) =>
        set(({ lines }) => {
          const next = { ...lines };
          if (qty <= 0) delete next[product.id];
          else next[product.id] = { product, qty: Math.min(qty, MAX_QTY_PER_ITEM) };
          return { lines: next };
        }),
    }),
    {
      name: "jhatpat-cart",
      version: 1,
      partialize: ({ lines, couponCode }) => ({ lines, couponCode }),
      migrate: () => ({ lines: {}, couponCode: null }),
      skipHydration: true,
    },
  ),
);

export const useCartQty = (productId: number) => useCartStore((state) => state.lines[productId]?.qty ?? 0);

export const useCartCount = () =>
  useCartStore((state) => Object.values(state.lines).reduce((count, line) => count + line.qty, 0));

const subscribeHydration = (listener: () => void) =>
  useCartStore.persist?.onFinishHydration(listener) ?? (() => {});
const getHydrated = () => useCartStore.persist?.hasHydrated() ?? false;

export const useCartHydrated = () => useSyncExternalStore(subscribeHydration, getHydrated, () => false);
