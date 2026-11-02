import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PreferredPaymentMethod } from "@/components/features/account/PreferredPaymentMethod";
import { TitleHeader } from "@/components/layout/TitleHeader";

export const metadata: Metadata = { title: "Payment Methods" };

export default function PaymentsPage() {
  return (
    <>
      <TitleHeader title="Payment Methods" back />
      <div className="space-y-3 px-4">
        <section className="rounded-card bg-surface p-4 shadow-card">
          <PreferredPaymentMethod />
          <p className="mt-3 px-1 text-xs text-muted">This method is selected by default at checkout. You can change it for any order.</p>
        </section>

        <section className="flex gap-3 rounded-card bg-surface p-4 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary">
            <ShieldCheck aria-hidden className="size-5 text-ink" />
          </span>
          <div className="text-sm">
            <h2 className="font-bold text-ink">Saved cards and UPI IDs</h2>
            <p className="mt-1 text-muted">
              Cards and UPI IDs are saved securely by our payment partner Razorpay when you pay. Jhatpat never stores your
              card number or CVV.
            </p>
          </div>
        </section>

        <p className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted">
          <LockKeyhole aria-hidden className="size-3.5 text-ink" />
          PCI DSS compliant · 256-bit encryption
        </p>
      </div>
    </>
  );
}
