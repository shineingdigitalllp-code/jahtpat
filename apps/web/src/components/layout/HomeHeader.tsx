"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { AccountSummary } from "@jhatpat/shared";
import { DeliveryLocation } from "@/components/features/address/DeliveryLocation";
import { SearchBar } from "@/components/features/home/SearchBar";
import { api } from "@/lib/api";

export function HomeHeader() {
  const { data: summary } = useQuery({
    queryKey: ["account-summary"],
    queryFn: () => api<AccountSummary>("/account/summary"),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const user = summary?.user ?? null;
  const firstName = user?.name ? user.name.trim().split(" ")[0] : null;
  const firstLetter = firstName ? firstName.charAt(0).toUpperCase() : null;

  return (
    <header className="rounded-b-[2rem] bg-linear-to-b from-primary via-primary to-primary-soft px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 shadow-card">
      {/* Top Bar: Profile & Greeting + Location Icon */}
      <div className="flex items-center justify-between gap-3">
        {user ? (
          <Link
            href="/account"
            className="flex items-center gap-3 min-w-0 transition active:scale-[0.98]"
            aria-label="View account"
          >
            {/* Avatar circle (vibrant purple ring matching reference design) */}
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#7c5cfc] text-white font-extrabold text-base shadow-xs ring-2 ring-white/60">
              {firstLetter}
            </div>

            {/* Greeting & Name */}
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-neutral-950">
                Hi, {firstName}
              </p>
              <p className="text-xs font-semibold text-neutral-800/80">
                Welcome back
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/login?next=/"
            className="flex items-center gap-3 min-w-0 transition active:scale-[0.98]"
            aria-label="Log in to your account"
          >
            {/* Guest Avatar circle */}
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-xs ring-1 ring-black/5">
              <UserRound className="size-5.5 text-neutral-800" strokeWidth={2} />
            </div>

            {/* Guest Greeting */}
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-neutral-950">
                Welcome to Jhatpat
              </p>
              <p className="text-xs font-semibold text-neutral-800/80 underline decoration-neutral-800/40 underline-offset-2">
                Login / Sign Up
              </p>
            </div>
          </Link>
        )}

        {/* Location / Address Icon Button */}
        <DeliveryLocation variant="icon" />
      </div>

      {/* Search Bar */}
      <SearchBar />
    </header>
  );
}
