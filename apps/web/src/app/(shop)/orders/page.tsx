import { PackageOpen, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { orderListQuerySchema, type OrderList, type OrderTab } from "@jhatpat/shared";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { OrderCard } from "@/components/features/orders/OrderCard";
import { TitleHeader } from "@/components/layout/TitleHeader";
import { buttonClass } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { getAuthed } from "@/lib/server-api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Orders" };

const TABS: { value: OrderTab; label: string }[] = [
  { value: "ongoing", label: "Ongoing" },
  { value: "past", label: "Past Orders" },
];

type OrdersPageProps = { searchParams: Promise<{ tab?: string }> };

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const parsed = orderListQuerySchema.safeParse(await searchParams);
  const tab = parsed.success ? parsed.data.tab : "ongoing";
  const data = await getAuthed<OrderList>(`/orders?tab=${tab}`);

  return (
    <>
      <TitleHeader
        title="My Orders"
        back
        action={
          <Link href="/categories" aria-label="Search products" className={buttonClass({ variant: "glass", size: "icon" })}>
            <Search aria-hidden className="size-5" />
          </Link>
        }
      />
      {data ? (
        <>
          <nav aria-label="Order tabs" className="mx-4 grid grid-cols-2 rounded-full bg-ink/[0.06] p-1">
            {TABS.map(({ value, label }) => {
              const selected = value === tab;
              const count = data.counts[value];
              return (
                <Link
                  key={value}
                  href={`/orders?tab=${value}`}
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-full text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary",
                    selected
                      ? "bg-surface font-semibold text-primary shadow-[0_1px_4px_rgb(17_17_17/0.12)]"
                      : "font-medium text-muted",
                  )}
                >
                  {label}
                  {value === "ongoing" && count > 0 && ` (${count})`}
                </Link>
              );
            })}
          </nav>
          <section aria-label={`${tab} orders`} className="mt-3 flex flex-col gap-3 px-4 pb-4">
            {data.orders.length > 0 ? (
              data.orders.map((order) => <OrderCard key={order.id} order={order} />)
            ) : (
              <div className="flex flex-col items-center rounded-card bg-surface px-6 py-12 text-center shadow-card">
                <IconTile icon={PackageOpen} color="orange" size="xl" />
                <p className="mt-3 font-bold">{tab === "ongoing" ? "No ongoing orders" : "No past orders yet"}</p>
                <p className="mt-1 text-sm text-muted">Fresh groceries are just a few taps away.</p>
                <Link href="/" className={buttonClass({ className: "mt-5" })}>
                  Start shopping
                </Link>
              </div>
            )}
          </section>
        </>
      ) : (
        <LoginPrompt message="See your ongoing and past orders here." next="/orders" />
      )}
    </>
  );
}
