import { TicketPercent, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { WalletData } from "@jhatpat/shared";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { buttonClass } from "@/components/ui/Button";
import { formatINR, formatOrderDate } from "@/lib/format";
import { getAuthed } from "@/lib/server-api";

export const metadata: Metadata = { title: "Wallet & Rewards" };

export default async function WalletPage() {
  const wallet = await getAuthed<WalletData>("/account/wallet");

  return (
    <>
      <TitleHeader title="Wallet & Rewards" back />
      {wallet ? (
        <div className="space-y-5 px-4">
          <section className="rounded-card bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary">
                <Wallet aria-hidden className="size-5 text-ink" />
              </span>
              <div>
                <p className="text-xs font-semibold text-muted">Jhatpat Cash</p>
                <p className="text-2xl leading-tight font-extrabold tracking-tight text-ink">{formatINR(wallet.walletPaise)}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 divide-x rounded-2xl bg-canvas py-3 text-center">
              <div>
                <dt className="text-[0.6875rem] font-semibold text-muted">Saved with coupons</dt>
                <dd className="mt-0.5 text-base font-extrabold text-positive">{formatINR(wallet.totalSavedPaise)}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold text-muted">Coupons used</dt>
                <dd className="mt-0.5 text-base font-extrabold text-ink">{wallet.claimed.length}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="px-1 pb-2 text-xs font-semibold text-muted">Coupons claimed</h2>
            {wallet.claimed.length === 0 ? (
              <div className="flex flex-col items-center rounded-card bg-surface px-6 py-8 text-center shadow-card">
                <span className="grid size-12 place-items-center rounded-full bg-primary-soft">
                  <TicketPercent aria-hidden className="size-6 text-ink" />
                </span>
                <p className="mt-3 text-sm font-bold text-ink">No coupons claimed yet</p>
                <p className="mt-1 text-xs text-muted">Coupons you use on orders will show up here.</p>
                <Link href="/offers" className={buttonClass({ variant: "outline", size: "sm", className: "mt-4" })}>
                  Browse offers
                </Link>
              </div>
            ) : (
              <ul className="divide-y overflow-hidden rounded-card bg-surface shadow-card">
                {wallet.claimed.map((item) => (
                  <li key={item.orderId} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft">
                      <TicketPercent aria-hidden className="size-4.5 text-ink" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold tracking-wide text-ink">{item.couponCode}</p>
                      <p className="truncate text-xs text-muted">
                        Order #{item.orderCode} · {formatOrderDate(item.claimedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-positive">-{formatINR(item.savedPaise)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <LoginPrompt message="Log in to see your wallet balance and rewards." next="/account/wallet" />
      )}
    </>
  );
}
