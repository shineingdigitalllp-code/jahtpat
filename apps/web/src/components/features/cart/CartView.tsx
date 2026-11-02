"use client";

import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CheckoutQuote, OffersData, ProductCard } from "@jhatpat/shared";
import { DeliveryLocation } from "@/components/features/address/DeliveryLocation";
import { api, apiSend } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MAX_QTY_PER_ITEM, useCartStore, type CartState } from "@/store/cart-store";
import { CouponSheet } from "./CouponSheet";

const DELIVERY_FEE_PAISE = 2000; // ₹20.00
const FREE_DELIVERY_MIN_PAISE = 19900; // ₹199.00

const DEMO_ITEMS: ProductCard[] = [
  {
    id: 901,
    slug: "fresh-cheese-pizza",
    name: "Fresh Cheese Pizza",
    subtitle: "Wood-fired fresh pizza",
    unit: "1 pc (approx. 350 g)",
    tag: "Bestseller",
    ratingAvg: 4.8,
    ratingCount: 120,
    pricePaise: 3500,
    mrpPaise: 4500,
    image: "/images/catalog/bread.jpg",
  },
  {
    id: 902,
    slug: "spinach-chicken",
    name: "Spinach & Chicken",
    subtitle: "Tender chicken with spinach",
    unit: "500 g",
    tag: "Fresh",
    ratingAvg: 4.7,
    ratingCount: 85,
    pricePaise: 1600,
    mrpPaise: 2000,
    image: "/images/catalog/chicken.jpg",
  },
  {
    id: 903,
    slug: "fresh-watermelon",
    name: "Fresh Watermelon",
    subtitle: "Sweet and juicy local watermelon",
    unit: "1 pc (approx. 2.5 kg)",
    tag: "Farm Fresh",
    ratingAvg: 4.9,
    ratingCount: 230,
    pricePaise: 1000,
    mrpPaise: 1500,
    image: "/images/catalog/fruit-basket.jpg",
  },
  {
    id: 904,
    slug: "organic-spinach",
    name: "Organic Spinach",
    subtitle: "Crisp organic greens",
    unit: "250 g",
    tag: "Organic",
    ratingAvg: 4.6,
    ratingCount: 94,
    pricePaise: 400,
    mrpPaise: 600,
    image: "/images/catalog/spinach.jpg",
  },
];

// Empty snapshot fallback to prevent hydration mismatch
const emptyCart: CartState = {
  lines: {},
  couponCode: null,
  setQty: () => {},
  setCoupon: () => {},
  clear: () => {},
};
function useHydratedCart() {
  return useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState(),
    () => emptyCart,
  );
}

export function CartView() {
  const router = useRouter();
  const cart = useHydratedCart();
  const setQty = useCartStore((s) => s.setQty);
  const setCoupon = useCartStore((s) => s.setCoupon);

  const [showCouponDialog, setShowCouponDialog] = useState(false);


  const lines = Object.values(cart.lines);
  const totalCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const itemTotalPaise = lines.reduce((sum, line) => sum + line.product.pricePaise * line.qty, 0);

  const items = lines.map(({ product, qty }) => ({ productId: product.id, qty }));

  const offersQuery = useQuery({
    queryKey: ["offers"],
    queryFn: () => api<OffersData>("/offers"),
    staleTime: 5 * 60_000,
  });

  const quoteQuery = useQuery({
    queryKey: ["checkout-quote", items, cart.couponCode],
    queryFn: () =>
      apiSend<CheckoutQuote>("/checkout/quote", "POST", {
        items,
        couponCode: cart.couponCode ?? undefined,
      }),
    enabled: items.length > 0,
    staleTime: 0,
    retry: false,
  });
  const quote = quoteQuery.data;

  // Fallback / optimistic calculation
  const optimisticDeliveryPaise =
    itemTotalPaise >= FREE_DELIVERY_MIN_PAISE || itemTotalPaise === 0 ? 0 : DELIVERY_FEE_PAISE;

  let optimisticDiscountPaise = 0;
  let optimisticError: string | null = null;
  if (cart.couponCode && offersQuery.data?.coupons) {
    const coupon = offersQuery.data.coupons.find((c) => c.code === cart.couponCode);
    if (coupon) {
      if (itemTotalPaise < coupon.minOrderPaise) {
        optimisticError = `Add items worth ₹${Math.ceil((coupon.minOrderPaise - itemTotalPaise) / 100)} more to use this coupon`;
      } else {
        const raw =
          coupon.type === "percent"
            ? Math.floor((itemTotalPaise * coupon.value) / 100)
            : coupon.type === "flat"
              ? coupon.value
              : optimisticDeliveryPaise;
        optimisticDiscountPaise = Math.min(
          raw,
          coupon.maxDiscountPaise ?? raw,
          itemTotalPaise + optimisticDeliveryPaise,
        );
      }
    }
  }

  const deliveryFeePaise = quote !== undefined ? quote.deliveryPaise : optimisticDeliveryPaise;
  const discountPaise = quote !== undefined ? quote.couponPaise : optimisticDiscountPaise;
  const couponError = quote !== undefined ? quote.couponError : optimisticError;
  const grandTotalPaise =
    quote !== undefined
      ? quote.totalPaise
      : Math.max(0, itemTotalPaise + deliveryFeePaise - discountPaise);

  const handleRemoveCoupon = () => setCoupon(null);

  return (
    <div className="mx-auto min-h-dvh max-w-app bg-canvas pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-canvas/95 px-4 pt-3 pb-2 backdrop-blur-md">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex size-10 items-center justify-center rounded-full bg-white shadow-xs transition hover:bg-neutral-50 active:scale-95"
          >
            <ArrowLeft className="size-5 text-neutral-800" strokeWidth={1.35} />
          </button>

          {/* Title */}
          <h1 className="text-lg font-extrabold tracking-tight text-neutral-900">My Cart</h1>

          {/* Action icon */}
          <div className="relative flex size-10 items-center justify-center rounded-full bg-white shadow-xs">
            <ShoppingBag className="size-5 text-neutral-700" strokeWidth={1.35} />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-black shadow-xs">
                {totalCount > 9 ? "9+" : totalCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="space-y-3 px-4 pt-2">
        <DeliveryLocation variant="card" />

        {/* Empty state */}
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white p-8 text-center shadow-xs">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
              <ShoppingBag className="size-8" strokeWidth={1.35} />
            </div>
            <h2 className="mt-4 text-base font-bold text-neutral-900">Your cart is empty</h2>
            <p className="mt-1 max-w-xs text-xs text-neutral-500">
              Explore fresh groceries and deals delivered in minutes.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-900 active:scale-95"
              >
                Start Shopping
              </Link>
              <button
                type="button"
                onClick={() => {
                  DEMO_ITEMS.forEach((item) => setQty(item, 2));
                  setCoupon("JHATPAT20");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-900 transition hover:bg-neutral-50 active:scale-95"
              >
                Load Demo Cart
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items list */}
            <section aria-label="Cart items" className="space-y-2.5">
              {lines.map(({ product, qty }) => {
                const lineTotalPaise = product.pricePaise * qty;
                return (
                  <article
                    key={product.id}
                    className="relative flex items-center gap-3.5 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-xs"
                  >
                    {/* Product Image */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50 border border-neutral-100">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill sizes="5rem" className="object-contain p-1" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-neutral-300">
                          <ShoppingBag className="size-8" strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="min-w-0 flex-1 pr-6">
                      <h3 className="line-clamp-1 text-sm font-bold text-neutral-900">{product.name}</h3>
                      <p className="mt-0.5 text-xs font-medium text-muted">{product.unit}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-ink">{formatINR(product.pricePaise)}</span>
                        {product.mrpPaise > product.pricePaise && (
                          <s className="text-muted">{formatINR(product.mrpPaise)}</s>
                        )}
                      </p>

                      {/* Stepper + Line total */}
                      <div className="mt-2.5 flex items-center justify-between">
                        {/* Stepper container */}
                        <div className="flex items-center gap-2 rounded-full border border-neutral-100 bg-[#FBF8F5] p-0.5">
                          <button
                            type="button"
                            onClick={() => setQty(product, qty - 1)}
                            aria-label={`Decrease ${product.name} quantity`}
                            className="flex size-7 items-center justify-center rounded-full bg-white text-neutral-700 shadow-xs transition hover:bg-neutral-50 active:scale-90"
                          >
                            <Minus className="size-3.5" strokeWidth={2} />
                          </button>
                          <span className="w-5 text-center text-xs font-bold tabular-nums text-neutral-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={qty >= MAX_QTY_PER_ITEM}
                            onClick={() => setQty(product, qty + 1)}
                            aria-label={`Increase ${product.name} quantity`}
                            className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-primary shadow-xs transition hover:bg-primary/20 active:scale-90 disabled:opacity-40"
                          >
                            <Plus className="size-3.5" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Line Total */}
                        <span className="text-sm font-bold text-neutral-900">{formatINR(lineTotalPaise)}</span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => setQty(product, 0)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-500 active:scale-90"
                    >
                      <Trash2 className="size-4" strokeWidth={1.35} />
                    </button>
                  </article>
                );
              })}
            </section>

            {/* Apply Coupon Card */}
            <section
              aria-label="Promotions and coupons"
              className="rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fee61b] text-black">
                    <Ticket className="size-5 text-black" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {cart.couponCode ? `Coupon Applied: ${cart.couponCode}` : "Apply Coupon"}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        couponError ? "text-red-500 font-medium" : "text-neutral-400",
                      )}
                    >
                      {cart.couponCode
                        ? discountPaise > 0
                          ? `Saved ${formatINR(discountPaise)} on this order`
                          : couponError ?? "Coupon applied"
                        : "Enter coupon code for discounts"}
                    </p>
                  </div>
                </div>

                {cart.couponCode ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="shrink-0 rounded-full bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200 active:scale-95"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCouponDialog(true)}
                    className="shrink-0 rounded-full bg-[#fee61b] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#fee61b]/90 active:scale-95"
                  >
                    Apply
                  </button>
                )}
              </div>
            </section>

            {/* Bill Summary Card */}
            <section
              aria-label="Order summary"
              className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral-900">Bill Summary</h2>
                <span className="text-xs font-medium text-neutral-400">{totalCount} Items</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Item Total</span>
                  <span className="font-semibold text-neutral-900">{formatINR(itemTotalPaise)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Delivery Fee</span>
                  {deliveryFeePaise === 0 ? (
                    <div className="flex items-center gap-1.5">
                      <s className="text-neutral-400">{formatINR(DELIVERY_FEE_PAISE)}</s>
                      <span className="font-bold text-emerald-600">FREE</span>
                    </div>
                  ) : (
                    <span className="font-semibold text-neutral-900">{formatINR(deliveryFeePaise)}</span>
                  )}
                </div>

                {discountPaise > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-emerald-600">
                      Discount {cart.couponCode ? `(${cart.couponCode})` : ""}
                    </span>
                    <span className="font-semibold text-emerald-600">- {formatINR(discountPaise)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-900">Grand Total</span>
                  <span className="text-base font-extrabold text-neutral-900">{formatINR(grandTotalPaise)}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Sticky Checkout CTA Bar */}
      {lines.length > 0 && (
        <aside
          aria-label="Checkout action"
          className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-app px-1"
        >
          <Link
            href="/checkout"
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-black px-5 text-white shadow-xl transition duration-200 hover:bg-neutral-900 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-sm font-bold tracking-wide">
              <span>Proceed to Checkout</span>
              <ArrowRight className="size-4.5" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-4">
              <span className="h-6 w-px bg-white/30" />
              <span className="text-base font-bold tracking-tight">{formatINR(grandTotalPaise)}</span>
            </div>
          </Link>
        </aside>
      )}

      <CouponSheet
        open={showCouponDialog}
        onClose={() => setShowCouponDialog(false)}
        appliedCode={cart.couponCode}
        onApply={setCoupon}
      />
    </div>
  );
}
