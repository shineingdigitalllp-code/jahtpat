"use client";

import { BadgeCheck, ChevronRight, TicketPercent } from "lucide-react";
import { useState } from "react";
import { CouponSheet } from "@/components/features/cart/CouponSheet";
import { formatINR } from "@/lib/format";

type CouponRowProps = {
  code: string | null;
  savingsPaise: number;
  error: string | null;
  onApply: (code: string | null) => void;
};

export function CouponRow({ code, savingsPaise, error, onApply }: CouponRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-card bg-surface shadow-card">
      {code ? (
        <div className="flex min-h-14 items-center gap-2.5 px-4">
          <BadgeCheck aria-hidden className="size-5 shrink-0 text-positive" strokeWidth={2} />
          <p className="min-w-0 flex-1 truncate text-sm text-ink">
            <span className="font-bold">{code}</span>
            <span className="text-positive"> · {formatINR(savingsPaise)} saved</span>
          </p>
          <button
            type="button"
            onClick={() => onApply(null)}
            className="min-h-11 shrink-0 px-1 text-xs font-bold text-danger focus-visible:outline-2 focus-visible:outline-primary"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-16 w-full items-center gap-3 rounded-card px-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
        >
          <TicketPercent aria-hidden className="size-6 shrink-0 text-ink" />
          <span className="flex-1 text-sm font-bold text-ink">Apply Coupon Code</span>
          <ChevronRight aria-hidden className="size-5 text-muted" />
        </button>
      )}
      {error && <p className="px-4 pb-3 text-xs font-semibold text-danger">{error}</p>}

      <CouponSheet open={open} onClose={() => setOpen(false)} appliedCode={code} onApply={onApply} />
    </section>
  );
}
