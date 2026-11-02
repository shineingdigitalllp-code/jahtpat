import type { CheckoutQuote } from "@jhatpat/shared";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BillDetails({ quote }: { quote: CheckoutQuote }) {
  const savings = quote.discountPaise + quote.couponPaise;

  return (
    <section aria-labelledby="bill-title" className="rounded-card bg-surface p-4 shadow-card">
      <h2 id="bill-title" className="text-base font-bold text-ink">
        Bill Details
      </h2>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Items total (MRP)</dt>
          <dd className="text-ink">{formatINR(quote.mrpPaise)}</dd>
        </div>
        {quote.discountPaise > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Product discount</dt>
            <dd className="font-semibold text-positive">-{formatINR(quote.discountPaise)}</dd>
          </div>
        )}
        {quote.couponPaise > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Coupon ({quote.couponCode})</dt>
            <dd className="font-semibold text-positive">-{formatINR(quote.couponPaise)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Delivery fee</dt>
          <dd className={cn("font-semibold", quote.deliveryPaise === 0 ? "text-positive" : "text-ink")}>
            {quote.deliveryPaise === 0 ? "FREE" : formatINR(quote.deliveryPaise)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-dashed pt-3 text-base font-extrabold text-ink">
          <dt>To pay</dt>
          <dd>{formatINR(quote.totalPaise)}</dd>
        </div>
      </dl>
      {savings > 0 && (
        <p className="mt-3 rounded-xl bg-positive-soft px-3 py-2 text-xs font-bold text-positive">
          You are saving {formatINR(savings)} on this order
        </p>
      )}
    </section>
  );
}
