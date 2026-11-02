"use client";

import { PaymentMethodList } from "@/components/features/checkout/PaymentMethodList";
import { usePreferencesStore } from "@/store/preferences-store";

export function PreferredPaymentMethod() {
  const method = usePreferencesStore((s) => s.paymentMethod);
  const setMethod = usePreferencesStore((s) => s.setPaymentMethod);

  return <PaymentMethodList legend="Preferred payment method" value={method} onChange={setMethod} />;
}
