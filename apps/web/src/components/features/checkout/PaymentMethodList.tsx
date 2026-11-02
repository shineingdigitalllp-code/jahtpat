import { Banknote, Building2, Check, CreditCard, Smartphone, Wallet, type LucideIcon } from "lucide-react";
import type { PaymentMethod } from "@jhatpat/shared";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const METHODS: { value: PaymentMethod; icon: LucideIcon; title: string; detail: string; badge?: string }[] = [
  { value: "upi", icon: Smartphone, title: "UPI", detail: "Google Pay, PhonePe, Paytm, BHIM or any UPI app", badge: "Recommended" },
  { value: "card", icon: CreditCard, title: "Credit / Debit Card", detail: "Visa, Mastercard, RuPay, Amex" },
  { value: "netbanking", icon: Building2, title: "Net Banking", detail: "All major Indian banks" },
  { value: "wallet", icon: Wallet, title: "Wallets", detail: "Paytm, Amazon Pay, Mobikwik, Freecharge" },
  { value: "cod", icon: Banknote, title: "Cash on Delivery", detail: "Pay by cash or UPI at your doorstep", badge: "₹0 extra" },
];

type PaymentMethodListProps = { value: PaymentMethod; onChange: (value: PaymentMethod) => void; legend: string };

export function PaymentMethodList({ value, onChange, legend }: PaymentMethodListProps) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-3 text-base font-bold text-ink">{legend}</legend>
      {METHODS.map(({ value: method, icon: Icon, title, detail, badge }) => {
        const selected = method === value;
        return (
          <label
            key={method}
            className={cn(
              "flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-3.5 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
              selected ? "border-primary bg-primary-soft" : "border-border",
            )}
          >
            <input
              type="radio"
              name="payment-method"
              value={method}
              checked={selected}
              onChange={() => onChange(method)}
              className="sr-only"
            />
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", selected ? "bg-primary" : "bg-canvas")}>
              <Icon aria-hidden className="size-5 text-ink" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                {title}
                {badge && <Badge variant="discount">{badge}</Badge>}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{detail}</span>
            </span>
            <span
              aria-hidden
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border-2",
                selected ? "border-ink bg-ink text-white" : "border-neutral-300",
              )}
            >
              {selected && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
