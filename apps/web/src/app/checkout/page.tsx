import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import { CheckoutSteps } from "@/components/features/checkout/CheckoutSteps";
import { CheckoutView } from "@/components/features/checkout/CheckoutView";
import { TitleHeader } from "@/components/layout/TitleHeader";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-app bg-canvas">
      <TitleHeader
        title="Checkout"
        back
        subtitle={
          <span className="flex items-center justify-center gap-1">
            <LockKeyhole aria-hidden className="size-3" strokeWidth={2.5} />
            Secure payment
          </span>
        }
      >
        <CheckoutSteps />
      </TitleHeader>
      <CheckoutView />
    </div>
  );
}
