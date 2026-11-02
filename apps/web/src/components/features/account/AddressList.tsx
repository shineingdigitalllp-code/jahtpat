"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Address } from "@jhatpat/shared";
import { Button, buttonClass } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { Sheet } from "@/components/ui/Sheet";
import { ADDRESSES_KEY, useAddresses, useSetDefaultAddress } from "@/hooks/use-addresses";
import { addressIcon, formatAddress } from "@/lib/address";
import { apiSend } from "@/lib/api";
import { cn } from "@/lib/utils";

type AddressListProps = { initialAddresses: Address[]; next: string | null };

export function AddressList({ initialAddresses, next }: AddressListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addresses = useAddresses(initialAddresses).data ?? initialAddresses;

  const makeDefault = useSetDefaultAddress({
    onError: (failure) => setError(failure.message),
    onSuccess: () => (next ? router.push(next) : router.refresh()),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/addresses/${id}`, "DELETE"),
    onMutate: async (id) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: ADDRESSES_KEY });
      const previous = queryClient.getQueryData<Address[]>(ADDRESSES_KEY);
      queryClient.setQueryData<Address[]>(ADDRESSES_KEY, (list = []) => list.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (failure, _id, context) => {
      if (context?.previous) queryClient.setQueryData(ADDRESSES_KEY, context.previous);
      setError(failure.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
      router.refresh();
    },
  });

  const withNext = (href: string) => (next ? `${href}?next=${encodeURIComponent(next)}` : href);

  return (
    <div className="space-y-4 px-4">
      <Link
        href={withNext("/account/addresses/new")}
        className="flex min-h-15 items-center gap-3 rounded-card bg-surface px-4 shadow-card transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary">
          <Plus aria-hidden className="size-5 text-ink" strokeWidth={2.25} />
        </span>
        <span className="flex-1 text-sm font-bold text-ink">Add new address</span>
        <ChevronRight aria-hidden className="size-5 text-muted" />
      </Link>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {addresses.length === 0 ? (
        <section className="flex flex-col items-center rounded-card bg-surface px-6 py-10 text-center shadow-card">
          <IconTile icon={MapPin} color="brand" size="xl" />
          <h2 className="mt-4 text-lg font-bold">No saved addresses</h2>
          <p className="mt-1 text-sm text-muted">Add an address to get groceries delivered to your door.</p>
        </section>
      ) : (
        <section>
          <h2 className="px-1 pb-2 text-xs font-semibold text-muted">
            {addresses.length} saved {addresses.length === 1 ? "address" : "addresses"}
          </h2>
          <ul className="divide-y overflow-hidden rounded-card bg-surface shadow-card">
            {addresses.map((address) => {
              const Icon = addressIcon(address.label);
              return (
                <li key={address.id} className="flex gap-3 p-4">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      address.isDefault ? "bg-primary" : "bg-canvas",
                    )}
                  >
                    <Icon aria-hidden className="size-4.5 text-ink" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[0.9375rem] font-bold text-ink">
                      {address.label}
                      {address.isDefault && (
                        <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-ink uppercase ring-1 ring-primary-strong/40 ring-inset">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted">
                      {formatAddress(address)}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {(next || !address.isDefault) &&
                        (address.isDefault && next ? (
                          <Link href={next} className={buttonClass({ variant: "accent", size: "sm", className: "h-8 px-3 text-xs" })}>
                            Deliver here
                          </Link>
                        ) : (
                          <Button
                            variant={next ? "accent" : "outline"}
                            size="sm"
                            className="h-8 px-3 text-xs"
                            pending={makeDefault.isPending && makeDefault.variables === address.id}
                            onClick={() => {
                              setError(null);
                              makeDefault.mutate(address.id);
                            }}
                          >
                            {next ? "Deliver here" : "Set as default"}
                          </Button>
                        ))}
                      <Link
                        href={withNext(`/account/addresses/${address.id}`)}
                        aria-label={`Edit ${address.label} address`}
                        className={buttonClass({ variant: "outline", size: "sm", className: "h-8 px-3 text-xs" })}
                      >
                        <Pencil aria-hidden className="size-3.5" />
                        Edit
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Delete ${address.label} address`}
                        className="h-8 px-3 text-xs text-danger"
                        onClick={() => setPendingDelete(address)}
                      >
                        <Trash2 aria-hidden className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Sheet open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Delete address?">
        <p className="text-sm text-muted">
          {pendingDelete && `${pendingDelete.label}: ${pendingDelete.line1}, ${pendingDelete.city}`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              if (pendingDelete) remove.mutate(pendingDelete.id);
              setPendingDelete(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
