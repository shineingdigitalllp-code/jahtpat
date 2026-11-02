"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, MapPin, ShieldCheck, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CheckoutQuote, PaymentMethod, PlacedOrder } from "@jhatpat/shared";
import { LoginPrompt } from "@/components/features/auth/LoginPrompt";
import { Button, buttonClass } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { apiSend, ApiError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { payWithRazorpay } from "@/lib/razorpay";
import { useCartHydrated, useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { BillDetails } from "./BillDetails";
import { CheckoutSkeleton } from "./CheckoutSkeleton";
import { CouponRow } from "./CouponRow";
import { PaymentMethodList } from "./PaymentMethodList";

const THUMBS = 4;

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCart = useCartStore((s) => s.clear);
  const preferredMethod = usePreferencesStore((s) => s.paymentMethod);
  const [chosenMethod, setMethod] = useState<PaymentMethod | null>(null);
  const method = chosenMethod ?? preferredMethod;
  const [payError, setPayError] = useState<string | null>(null);

  const items = Object.values(lines).map(({ product, qty }) => ({ productId: product.id, qty }));
  const quoteQuery = useQuery({
    queryKey: ["checkout-quote", items, couponCode],
    queryFn: () => apiSend<CheckoutQuote>("/checkout/quote", "POST", { items, couponCode: couponCode ?? undefined }),
    enabled: hydrated && items.length > 0,
    staleTime: 0,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
  });
  const quote = quoteQuery.data;

  const placeOrder = useMutation({
    mutationFn: async () => {
      const order = await apiSend<PlacedOrder>("/orders", "POST", {
        items,
        couponCode: quote?.couponCode ?? undefined,
        paymentMethod: method,
      });
      if (order.razorpay && method !== "cod") {
        const payment = await payWithRazorpay({
          keyId: order.razorpay.keyId,
          orderId: order.razorpay.orderId,
          amountPaise: order.razorpay.amountPaise,
          orderCode: order.code,
          method,
        });
        await apiSend("/payments/razorpay/verify", "POST", {
          orderId: order.id,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature,
        });
      }
    },
    onMutate: () => setPayError(null),
    onSuccess: () => {
      clearCart();
      router.replace("/orders");
    },
    onError: (error) => setPayError(error.message),
  });

  if (placeOrder.isSuccess) return <CheckoutSkeleton />;

  if (hydrated && items.length === 0) {
    return (
      <>
        <section className="mx-4 mt-6 flex flex-col items-center rounded-card bg-surface px-6 py-10 text-center shadow-card">
          <IconTile icon={ShoppingBag} color="brand" size="xl" />
          <h2 className="mt-4 text-lg font-bold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-muted">Add items to your cart to check out.</p>
          <Link href="/" className={buttonClass({ size: "lg", className: "mt-6 w-full" })}>
            Shop Now
          </Link>
        </section>
      </>
    );
  }

  if (quoteQuery.error instanceof ApiError && quoteQuery.error.status === 401) {
    return (
      <>
        <LoginPrompt message="Log in to choose a payment method and place your order." next="/checkout" />
      </>
    );
  }

  if (quoteQuery.isError) {
    return (
      <>
        <section className="mx-4 mt-6 rounded-card bg-surface px-6 py-10 text-center shadow-card">
          <h2 className="text-lg font-bold">Could not load checkout</h2>
          <p className="mt-1 text-sm text-muted">{quoteQuery.error.message}</p>
          <Button size="lg" className="mt-6 w-full" onClick={() => quoteQuery.refetch()}>
            Try again
          </Button>
        </section>
      </>
    );
  }

  if (!quote) return <CheckoutSkeleton />;

  const cartChanged =
    quote.items.length !== items.length || quote.items.some((line, i) => line.qty !== items[i]?.qty);
  const blocked = cartChanged || !quote.address;

  return (
    <>
      <div className="space-y-3 px-4 pb-36">
        <section className="flex gap-3 rounded-card bg-surface p-4 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary">
            <MapPin aria-hidden className="size-5 text-ink" />
          </span>
          {quote.address ? (
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold text-ink">Delivering to {quote.address.label}</p>
              <p className="truncate text-muted">
                {[quote.address.line1, quote.address.line2, quote.address.city, quote.address.pincode].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-ink">
                <Clock aria-hidden className="size-3.5" /> Superfast delivery in minutes
              </p>
            </div>
          ) : (
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold text-ink">No delivery address</p>
              <p className="text-muted">Add an address to place this order.</p>
            </div>
          )}
          <Link
            href={quote.address ? "/account/addresses?next=/checkout" : "/account/addresses/new?next=/checkout"}
            className={buttonClass({ variant: quote.address ? "outline" : "accent", size: "sm", className: "self-center" })}
          >
            {quote.address ? "Change" : "Add"}
          </Link>
        </section>

        <section className="rounded-card bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Order Summary ({quote.itemCount} items)</h2>
            <Link href="/cart" className="text-sm font-bold text-ink underline decoration-primary decoration-2 underline-offset-4">
              Edit
            </Link>
          </div>
          <ul className="mt-3 flex gap-2">
            {quote.items.slice(0, THUMBS).map(({ product, qty }) => (
              <li key={product.id} className="relative size-14 overflow-hidden rounded-xl border border-border/60 bg-canvas/60">
                {product.image && <Image src={product.image} alt={product.name} fill sizes="3.5rem" className="object-contain p-1" />}
                {qty > 1 && (
                  <span className="absolute right-0.5 bottom-0.5 rounded-md bg-ink px-1 text-[0.625rem] font-bold text-white">
                    x{qty}
                  </span>
                )}
              </li>
            ))}
            {quote.items.length > THUMBS && (
              <li className="grid size-14 place-items-center rounded-xl bg-canvas text-sm font-bold text-ink">
                +{quote.items.length - THUMBS}
              </li>
            )}
          </ul>
          {cartChanged && (
            <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
              Some items are out of stock or limited. Update your cart to continue.
            </p>
          )}
        </section>

        <CouponRow
          code={quote.couponCode}
          savingsPaise={quote.couponPaise}
          error={quote.couponError}
          onApply={setCoupon}
        />

        <section className="rounded-card bg-surface p-4 shadow-card">
          <PaymentMethodList legend="Select Payment Method" value={method} onChange={setMethod} />
        </section>

        <BillDetails quote={quote} />

        <p className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted">
          <ShieldCheck aria-hidden className="size-4 text-ink" />
          100% secure payments · PCI DSS compliant
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {payError && (
          <p role="alert" className="mb-2 text-center text-xs font-semibold text-danger">
            {payError}
          </p>
        )}
        <div className="flex items-center gap-4">
          <div className="leading-tight">
            <p className="text-lg font-extrabold text-ink">{formatINR(quote.totalPaise)}</p>
            <p className="text-xs text-muted">Total to pay</p>
          </div>
          <Button
            variant="accent"
            size="lg"
            className="flex-1"
            disabled={blocked}
            pending={placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
          >
            {method === "cod" ? "Place Order" : `Pay ${formatINR(quote.totalPaise)}`}
          </Button>
        </div>
      </div>
    </>
  );
}
