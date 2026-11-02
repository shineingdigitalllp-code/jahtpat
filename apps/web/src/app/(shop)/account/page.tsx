import {
  CalendarCheck,
  CircleHelp,
  CreditCard,
  MapPin,
  Package,
  Settings,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import type { AccountSummary } from "@jhatpat/shared";
import { AccountMenuItem } from "@/components/features/account/AccountMenuItem";
import { LogoutButton } from "@/components/features/account/LogoutButton";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { formatINR, formatMobile } from "@/lib/format";
import { getAuthed } from "@/lib/server-api";

export const metadata: Metadata = { title: "My Account" };

const SHOPPING: ComponentProps<typeof AccountMenuItem>[] = [
  {
    href: "/orders",
    icon: Package,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    title: "My Orders",
    subtitle: "Order status and buy again",
  },
  {
    href: "/account/addresses",
    icon: MapPin,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    title: "Saved Addresses",
    subtitle: "Manage your delivery addresses",
  },
  {
    href: "/account/payments",
    icon: CreditCard,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-700",
    title: "Payment Methods",
    subtitle: "Cards, UPI & more",
  },
  {
    href: "/account/wallet",
    icon: Wallet,
    iconBg: "bg-amber-100/70",
    iconColor: "text-amber-800",
    title: "Wallet & Rewards",
    subtitle: "Balance, offers and cashback",
  },
];

const MORE: ComponentProps<typeof AccountMenuItem>[] = [
  {
    href: "/account/help",
    icon: CircleHelp,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-800",
    title: "Help & Support",
    subtitle: "FAQs, contact us",
  },
  {
    href: "/account/settings",
    icon: Settings,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-800",
    title: "Settings",
    subtitle: "App preferences",
  },
];

function MenuGroup({
  label,
  items,
}: {
  label: string;
  items: ComponentProps<typeof AccountMenuItem>[];
}) {
  return (
    <section>
      <h2 className="px-1 pb-2 text-[11px] font-black uppercase tracking-wider text-neutral-400">
        {label}
      </h2>
      <ul className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-black/5 divide-y divide-neutral-100">
        {items.map((item) => (
          <AccountMenuItem key={item.title} {...item} />
        ))}
      </ul>
    </section>
  );
}

export default async function AccountPage() {
  const summary = await getAuthed<AccountSummary>("/account/summary");

  return (
    <div className="flex-1 bg-gradient-to-b from-[#FED843]/30 via-neutral-50/50 to-neutral-50">
      {/* Top Header */}
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-neutral-950">
            Account
          </h1>

          <Link
            href="/account/settings"
            aria-label="Settings"
            className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 backdrop-blur-md transition hover:bg-white active:scale-95"
          >
            <Settings aria-hidden className="size-5 text-neutral-900" strokeWidth={2} />
          </Link>
        </div>
      </header>

      {summary ? (
        <AccountContent summary={summary} />
      ) : (
        <div className="px-4 pt-4">
          <LoginPrompt message="Manage your profile, addresses and orders." next="/account" />
        </div>
      )}
    </div>
  );
}

function AccountContent({
  summary: { user, walletPaise, addressCount, orderCount },
}: {
  summary: AccountSummary;
}) {
  const stats = [
    {
      href: "/account/wallet",
      icon: Wallet,
      iconBg: "bg-amber-100/70",
      iconColor: "text-amber-800",
      value: formatINR(walletPaise),
      label: "Wallet",
    },
    {
      href: "/account/addresses",
      icon: MapPin,
      iconBg: "bg-emerald-100/70",
      iconColor: "text-emerald-800",
      value: addressCount,
      label: "Addresses",
    },
    {
      href: "/orders",
      icon: Package,
      iconBg: "bg-blue-100/70",
      iconColor: "text-blue-800",
      value: orderCount,
      label: "Orders",
    },
  ];

  const firstLetter = (user.name || "User").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-5 px-4 pt-2">
      {/* Profile Card */}
      <div className="flex items-center gap-3.5 rounded-3xl bg-white p-4.5 shadow-sm ring-1 ring-black/5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-black text-[#FED843] text-2xl font-black shadow-md ring-2 ring-[#FED843]">
          {firstLetter}
        </div>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-lg font-black tracking-tight text-neutral-950">
            {user.name}
          </span>
          {user.mobile && (
            <span className="block text-xs font-semibold text-neutral-600">
              {formatMobile(user.mobile)}
            </span>
          )}
          {user.email && (
            <span className="block truncate text-xs font-medium text-neutral-400">
              {user.email}
            </span>
          )}
        </div>

        <Link
          href="/account/profile"
          className="rounded-full bg-black px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-neutral-900 active:scale-95"
        >
          Edit
        </Link>
      </div>

      {/* 3 Stats Mini-Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(({ href, icon: Icon, iconBg, iconColor, value, label }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-3 shadow-xs ring-1 ring-black/5 transition hover:shadow-sm active:scale-95"
          >
            <div className={`flex size-8 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
              <Icon aria-hidden className="size-4" strokeWidth={2.25} />
            </div>
            <span className="mt-2 text-base font-black tracking-tight text-neutral-950 tabular-nums">
              {value}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Menu Groups */}
      <MenuGroup label="Shopping" items={SHOPPING} />
      <MenuGroup label="More" items={MORE} />

      {/* Logout Action Button */}
      <div className="pt-1">
        <LogoutButton />
      </div>

      {/* App Version Tag */}
      <p className="pt-2 text-center text-[11px] font-medium text-neutral-400">
        Jhatpat v1.0.0 · Fast &amp; Fresh
      </p>
    </div>
  );
}
