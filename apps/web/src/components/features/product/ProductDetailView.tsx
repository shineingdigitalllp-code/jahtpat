"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Clock, Heart, LayoutGrid, Share2, Star, Zap } from "lucide-react";
import type { ProductCard as ProductCardData, ProductDetail } from "@jhatpat/shared";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MAX_QTY_PER_ITEM, useCartStore } from "@/store/cart-store";
import { ProductCard } from "./ProductCard";

const LOW_STOCK = 5;

const WHY_SHOP = [
  { icon: Zap, title: "Superfast delivery", text: "Get your order delivered to your doorstep in minutes." },
  { icon: BadgePercent, title: "Best prices & offers", text: "Everyday low prices with offers directly from brands." },
  { icon: LayoutGrid, title: "Wide assortment", text: "Groceries, fresh produce, snacks, household and more." },
];

type ProductDetailViewProps = {
  product: ProductDetail;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [qty, setQty] = useState(1);
  const cartQty = useCartStore((s) => s.lines[product.id]?.qty ?? 0);
  const inCart = cartQty > 0;
  const setCartQty = useCartStore((s) => s.setQty);
  const currentQty = inCart ? cartQty : qty;

  const images = product.images.length > 0 ? product.images : ["/images/catalog/apples.jpg"];
  const off = discountPercent(product.pricePaise, product.mrpPaise);
  const description = product.description || product.subtitle;
  const outOfStock = product.stock <= 0;

  const share = () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: product.name, url }).catch(() => undefined);
    else navigator.clipboard.writeText(url);
  };

  const productCard: ProductCardData = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    unit: product.unit,
    tag: product.tag,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    pricePaise: product.pricePaise,
    mrpPaise: product.mrpPaise,
    image: images[0] ?? null,
  };

  const handleQtyChange = (nextQty: number) => {
    if (inCart) {
      if (nextQty <= 0) {
        setCartQty(productCard, 0);
        setQty(1);
      } else {
        setCartQty(productCard, nextQty);
      }
    } else {
      setQty(Math.max(1, nextQty));
    }
  };

  const addToCart = () => setCartQty(productCard, qty);

  return (
    <div className="mx-auto min-h-dvh max-w-app bg-canvas pb-28">
      <section aria-label="Product images" className="relative bg-surface">
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3">
          <BackButton />
          <h1 className="sr-only">Product details</h1>
          <Button variant="glass" size="icon" aria-label="Share product" onClick={share}>
            <Share2 aria-hidden className="size-5" />
          </Button>
        </header>

        <div className="relative aspect-square w-full overflow-hidden bg-canvas/40">
          <Image
            src={images[imageIndex] ?? images[0] ?? ''}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 30rem"
            className="object-contain p-4"
          />
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-current={index === imageIndex}
                onClick={() => setImageIndex(index)}
                className="relative grid h-2 place-items-center after:absolute after:-inset-3"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-all duration-200 ease-out",
                    index === imageIndex ? "w-5 bg-surface" : "w-2 bg-surface/50",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="relative -mt-7 rounded-t-[1.75rem] bg-surface px-5 pt-6 pb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-xs font-bold text-ink">
            <Zap aria-hidden className="size-3.5" />
            Superfast
          </span>
          {product.tag && <Badge variant="fresh">{product.tag}</Badge>}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl leading-tight font-extrabold text-ink">{product.name}</h2>
            {product.subtitle && <p className="mt-1 text-sm text-muted">{product.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => setIsWishlisted((v) => !v)}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="grid size-11 shrink-0 place-items-center rounded-2xl border bg-surface transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
          >
            <Heart aria-hidden className={cn("size-5", isWishlisted ? "fill-danger text-danger" : "text-ink")} />
          </button>
        </div>

        <p className="mt-2 flex items-center gap-1 text-sm text-muted">
          <Star aria-hidden className="size-4 fill-primary text-primary-strong" />
          <span className="font-bold text-ink">{product.ratingAvg.toFixed(1)}</span>
          <span>({product.ratingCount.toLocaleString("en-IN")} ratings)</span>
        </p>

        <div className="mt-4 rounded-2xl border p-4">
          <p className="text-xs font-semibold text-muted">{product.unit}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xl font-extrabold text-ink">{formatINR(product.pricePaise)}</span>
            {off > 0 && (
              <>
                <span className="text-sm text-muted">
                  MRP <s>{formatINR(product.mrpPaise)}</s>
                </span>
                <Badge variant="discount">{off}% OFF</Badge>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">(Inclusive of all taxes)</p>
          {product.stock > 0 && product.stock <= LOW_STOCK && (
            <p className="mt-2 text-xs font-bold text-danger">Only {product.stock} left</p>
          )}
        </div>
      </div>

      <section className="mt-2 bg-surface px-5 py-5">
        <h3 className="text-base font-bold text-ink">Why shop from Jhatpat?</h3>
        <ul className="mt-4 space-y-4">
          {WHY_SHOP.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft">
                <Icon aria-hidden className="size-5 text-ink" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="text-xs text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-2 bg-surface px-5 py-5">
        <h3 className="text-base font-bold text-ink">Product Details</h3>
        <dl className="mt-3 space-y-4 text-sm">
          <div>
            <dt className="font-bold text-ink">Unit</dt>
            <dd className="mt-0.5 text-muted">{product.unit}</dd>
          </div>
          <div>
            <dt className="font-bold text-ink">Category</dt>
            <dd className="mt-0.5 text-muted">{product.category.name}</dd>
          </div>
          {description && (
            <div>
              <dt className="font-bold text-ink">Description</dt>
              <dd className={cn("mt-0.5 leading-relaxed text-muted", !isExpanded && "line-clamp-3")}>{description}</dd>
              {description.length > 140 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  className="mt-1 font-bold text-ink underline decoration-primary decoration-2 underline-offset-4"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}
          <div>
            <dt className="font-bold text-ink">Return Policy</dt>
            <dd className="mt-0.5 leading-relaxed text-muted">
              This item is non-returnable. For a damaged, defective or expired product, request a replacement within 48
              hours of delivery.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-ink">Seller</dt>
            <dd className="mt-0.5 text-muted">Jhatpat</dd>
          </div>
          <div>
            <dt className="font-bold text-ink">Disclaimer</dt>
            <dd className="mt-0.5 leading-relaxed text-muted">
              Every effort is made to keep product information accurate. Actual packaging may carry more or different
              information, so please read the label before use.
            </dd>
          </div>
        </dl>
      </section>

      {product.similarProducts.length > 0 && (
        <section className="mt-2 bg-surface py-5">
          <h3 className="px-5 text-base font-bold text-ink">Similar products</h3>
          <div className="no-scrollbar mt-3 flex snap-x scroll-pl-5 gap-3 overflow-x-auto pl-5 after:w-2 after:shrink-0 after:content-['']">
            {product.similarProducts.map((item) => (
              <div key={item.id} className="w-36 shrink-0 snap-start">
                <ProductCard product={item} className="h-full border shadow-none" />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-app border-t bg-surface px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-4">
          <QtyStepper
            value={currentQty}
            onChange={handleQtyChange}
            min={inCart ? 0 : 1}
            max={MAX_QTY_PER_ITEM}
            label="Quantity"
            size="lg"
          />
          {outOfStock ? (
            <Button variant="accent" size="lg" className="flex-1" disabled>
              Out of Stock
            </Button>
          ) : inCart ? (
            <Link
              href="/cart"
              className={buttonClass({ variant: "accent", size: "lg", className: "flex-1" })}
            >
              Go to Cart
            </Link>
          ) : (
            <Button variant="accent" size="lg" className="flex-1" onClick={addToCart}>
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
