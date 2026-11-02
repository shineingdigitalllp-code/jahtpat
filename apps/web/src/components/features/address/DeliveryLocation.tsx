"use client";

import { Check, ChevronDown, ChevronRight, LocateFixed, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAddresses, useSetDefaultAddress } from "@/hooks/use-addresses";
import { addressIcon, formatAddress } from "@/lib/address";
import { ApiError } from "@/lib/api";
import { DEFAULT_CITY } from "@/lib/constants";
import { cn } from "@/lib/utils";

type DeliveryLocationProps = { variant: "home" | "compact" | "pill" | "card" | "icon" };

export function DeliveryLocation({ variant }: DeliveryLocationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: addresses, error: loadError, isPending } = useAddresses();
  const setDefault = useSetDefaultAddress({ onError: (failure) => setError(failure.message) });

  const loggedOut = loadError instanceof ApiError && loadError.status === 401;
  const current = addresses?.find((item) => item.isDefault) ?? addresses?.[0];
  const title = current ? current.label : DEFAULT_CITY;
  const detail = current ? `${current.line1}, ${current.city}` : null;
  const newAddressHref = (locate: boolean) =>
    `/account/addresses/new?${locate ? "locate=1&" : ""}next=${encodeURIComponent(pathname)}`;

  const choose = (id: string) => {
    setError(null);
    setOpen(false);
    if (id !== current?.id) setDefault.mutate(id);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Delivery location: ${title}${detail ? `, ${detail}` : ""}. Change`}
        className={cn(
          "min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          variant === "home" && "block max-w-full rounded-lg",
          variant === "compact" && "flex flex-1 items-center gap-1 rounded-lg",
          variant === "pill" && "flex h-9 max-w-full items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-ink shadow-xs",
          variant === "card" && "flex w-full items-center gap-3 rounded-card bg-surface p-3.5 shadow-card",
          variant === "icon" && "shrink-0 rounded-full",
        )}
      >
        {variant === "icon" && (
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-xs ring-1 ring-black/5 transition hover:bg-neutral-50 active:scale-95">
            <MapPin aria-hidden className="size-5 text-neutral-900" strokeWidth={2} />
          </span>
        )}
        {variant === "home" && (
          <>
            <span className="block text-xs font-bold text-neutral-800">Deliver to</span>
            <span className="mt-0.5 flex items-center gap-1 text-[0.9375rem] font-bold text-neutral-950">
              <span className="min-w-0 truncate">{detail ? `${title} · ${detail}` : title}</span>
              <ChevronDown aria-hidden className="size-4 shrink-0 text-neutral-800" strokeWidth={2.5} />
            </span>
          </>
        )}
        {variant === "compact" && (
          <>
            <MapPin aria-hidden className="size-4.5 shrink-0 fill-black text-primary" strokeWidth={1.75} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[0.625rem] text-muted">Deliver to {current ? title : ""}</span>
              <span className="flex items-center gap-0.5 text-xs font-semibold">
                <span className="min-w-0 truncate">{detail ?? title}</span>
                <ChevronDown aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />
              </span>
            </span>
          </>
        )}
        {variant === "pill" && (
          <>
            <MapPin aria-hidden className="size-3.5 shrink-0 fill-black text-ink" />
            <span className="min-w-0 truncate">{detail ?? title}</span>
            <ChevronDown aria-hidden className="size-3.5 shrink-0 text-ink/70" />
          </>
        )}
        {variant === "card" && (
          <>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary">
              <MapPin aria-hidden className="size-5 text-ink" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6875rem] text-muted">Delivering to</span>
              <span className="block truncate text-sm font-bold text-ink">{detail ? `${title} · ${detail}` : title}</span>
            </span>
            <span className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-ink">Change</span>
          </>
        )}
      </button>
      {error && variant === "card" && (
        <p role="alert" className="mt-2 text-xs font-semibold text-danger">
          {error}
        </p>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Select delivery address">
        {loggedOut ? (
          <div className="py-2 text-center">
            <p className="text-sm text-muted">Log in to save addresses and get faster checkout.</p>
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonClass({ size: "lg", className: "mt-4 w-full" })}>
              Log in
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y overflow-hidden rounded-2xl border">
              <Link href={newAddressHref(true)} className="flex min-h-14 items-center gap-3 px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary">
                  <LocateFixed aria-hidden className="size-4.5 text-ink" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">Use current location</span>
                  <span className="block text-xs text-muted">Detect using your device GPS</span>
                </span>
                <ChevronRight aria-hidden className="size-5 text-muted" />
              </Link>
              <Link href={newAddressHref(false)} className="flex min-h-14 items-center gap-3 px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas">
                  <Plus aria-hidden className="size-4.5 text-ink" />
                </span>
                <span className="flex-1 text-sm font-bold text-ink">Add address manually</span>
                <ChevronRight aria-hidden className="size-5 text-muted" />
              </Link>
            </div>

            {isPending ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            ) : loadError ? (
              <p className="mt-4 text-center text-sm text-muted">Could not load your addresses.</p>
            ) : (
              addresses.length > 0 && (
                <>
                  <h3 className="mt-5 mb-2 text-xs font-semibold text-muted">Saved addresses</h3>
                  <ul role="radiogroup" aria-label="Saved addresses" className="divide-y overflow-hidden rounded-2xl border">
                    {addresses.map((address) => {
                      const Icon = addressIcon(address.label);
                      const selected = address.id === current?.id;
                      return (
                        <li key={address.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => choose(address.id)}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                              selected && "bg-primary-soft",
                            )}
                          >
                            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", selected ? "bg-primary" : "bg-canvas")}>
                              <Icon aria-hidden className="size-4 text-ink" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-ink">{address.label}</span>
                              <span className="line-clamp-2 text-xs text-muted">{formatAddress(address)}</span>
                            </span>
                            {selected && <Check aria-hidden className="size-5 shrink-0 text-ink" strokeWidth={2.5} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href="/account/addresses"
                    className="mt-3 block py-2 text-center text-sm font-bold text-ink underline decoration-primary-strong decoration-2 underline-offset-4"
                  >
                    Manage addresses
                  </Link>
                </>
              )
            )}
          </>
        )}
      </Sheet>
    </>
  );
}
