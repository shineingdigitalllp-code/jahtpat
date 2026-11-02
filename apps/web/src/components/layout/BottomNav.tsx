"use client";

import { ArrowRight, BadgePercent, CircleUserRound, House, Shapes, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/categories", label: "Categories", icon: Shapes },
  { href: "/offers", label: "Offers", icon: BadgePercent },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/account", label: "Account", icon: CircleUserRound },
];

const emptyLines: ReturnType<typeof useCartStore.getState>["lines"] = {};

function useCartSummary() {
  const lines = useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState().lines,
    () => emptyLines,
  );
  const items = Object.values(lines);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPaise = items.reduce((sum, item) => sum + item.product.pricePaise * item.qty, 0);
  return { count, totalPaise };
}

export function BottomNav() {
  const pathname = usePathname();
  const { count, totalPaise } = useCartSummary();
  const isExcludedPage =
    pathname === "/cart" || pathname.startsWith("/account") || pathname.startsWith("/profile");
  const showCartPill = count > 0 && !isExcludedPage;

  return (
    <div className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex w-[22.5rem] max-w-[calc(100%-1.5rem)] flex-col items-center gap-2 pointer-events-none">
      {/* Floating View Cart Pill (Mac theme: subtle frosted dark glass) */}
      {showCartPill && (
        <Link
          href="/cart"
          aria-label={`View cart with ${count} items total ${formatINR(totalPaise)}`}
          className="pointer-events-auto flex h-11 w-full items-center justify-between rounded-full bg-[#161618]/90 px-4 text-xs text-white backdrop-blur-2xl ring-1 ring-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition duration-200 ease-out hover:bg-[#1f1f23]/95 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-6 shrink-0 items-center justify-center rounded-full bg-primary px-2.5 text-[11px] font-extrabold text-black shadow-xs">
              {count > 99 ? "99+" : count} {count === 1 ? "item" : "items"}
            </span>
            <span className="font-bold text-white tracking-tight">{formatINR(totalPaise)}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-[#fee61b] hover:text-[#fff170] shrink-0 pl-2">
            <span>View Cart</span>
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </div>
        </Link>
      )}

      {/* Main Bottom Nav Bar */}
      <nav
        aria-label="Primary"
        className="pointer-events-auto w-full rounded-full bg-black p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
      >
        <ul className="flex items-center gap-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href} className={cn("shrink-0", active && "flex-1 min-w-0")}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95",
                    active
                      ? "h-11 w-full rounded-full bg-primary px-3 gap-1.5 text-black shadow-sm font-bold"
                      : "size-11 rounded-full bg-white text-black hover:bg-neutral-50",
                  )}
                >
                  <Icon aria-hidden className="size-5.5 shrink-0" strokeWidth={1.4} />
                  {active && <span className="truncate text-xs font-bold tracking-tight">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
