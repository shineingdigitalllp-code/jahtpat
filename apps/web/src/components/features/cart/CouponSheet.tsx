"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, TicketPercent } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { OffersData } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type CouponSheetProps = {
  open: boolean;
  onClose: () => void;
  appliedCode: string | null;
  onApply: (code: string) => void;
};

export function CouponSheet({ open, onClose, appliedCode, onApply }: CouponSheetProps) {
  const [draft, setDraft] = useState("");
  const offers = useQuery({
    queryKey: ["offers"],
    queryFn: () => api<OffersData>("/offers"),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const apply = (code: string) => {
    onApply(code.trim().toUpperCase());
    setDraft("");
    onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) apply(draft);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Apply Coupon">
      <form
        onSubmit={submit}
        className="flex h-14 items-center gap-2 rounded-2xl border-2 border-dashed border-primary-strong bg-primary-soft pr-1.5 pl-4 focus-within:border-solid focus-within:border-ink"
      >
        <TicketPercent aria-hidden className="size-5 shrink-0 text-ink" />
        <label htmlFor="coupon-code" className="sr-only">
          Coupon code
        </label>
        <input
          id="coupon-code"
          value={draft}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          autoComplete="off"
          maxLength={30}
          className="min-w-0 flex-1 bg-transparent text-sm font-bold tracking-wider text-ink uppercase outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-muted placeholder:normal-case"
        />
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          Apply
        </Button>
      </form>

      <h3 className="mt-6 mb-3 text-xs font-bold tracking-wider text-muted uppercase">Available offers</h3>

      {offers.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-card" />
          ))}
        </div>
      ) : offers.isError ? (
        <div className="rounded-card border p-4 text-center text-sm">
          <p className="text-muted">Could not load offers.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => offers.refetch()}>
            Retry
          </Button>
        </div>
      ) : offers.data.coupons.length === 0 ? (
        <p className="rounded-card border p-4 text-center text-sm text-muted">No offers available right now.</p>
      ) : (
        <ul className="space-y-3">
          {offers.data.coupons.map((coupon) => {
            const applied = coupon.code === appliedCode;
            return (
              <li
                key={coupon.id}
                className={cn(
                  "relative flex overflow-hidden rounded-card border bg-surface shadow-card",
                  applied && "border-ink",
                )}
              >
                <div className="flex w-14 shrink-0 items-center justify-center bg-primary">
                  <span className="-rotate-90 text-xs font-extrabold tracking-[0.2em] whitespace-nowrap text-ink">
                    OFFER
                  </span>
                </div>
                <span aria-hidden className="absolute top-1/2 left-12 size-4 -translate-y-1/2 rounded-full bg-surface" />
                <div className="min-w-0 flex-1 py-3.5 pr-3 pl-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base leading-tight font-extrabold text-ink">{coupon.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{coupon.subtitle}</p>
                    </div>
                    {applied ? (
                      <span className="flex h-9 items-center gap-1 text-xs font-bold text-ink">
                        <Check aria-hidden className="size-4" strokeWidth={3} />
                        Applied
                      </span>
                    ) : (
                      <Button
                        variant="accent"
                        size="sm"
                        aria-label={`Apply ${coupon.code}`}
                        onClick={() => apply(coupon.code)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 border-t border-dashed pt-2.5">
                    <span className="rounded-lg border border-dashed border-ink/40 bg-canvas px-2 py-1 text-xs font-bold tracking-wider text-ink">
                      {coupon.code}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
