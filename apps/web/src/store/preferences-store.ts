import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaymentMethod } from "@jhatpat/shared";

type PreferencesState = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      paymentMethod: "upi",
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
    }),
    { name: "jhatpat-preferences", partialize: ({ paymentMethod }) => ({ paymentMethod }), skipHydration: true },
  ),
);
