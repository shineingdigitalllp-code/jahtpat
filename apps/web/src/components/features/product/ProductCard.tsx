import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ProductCard as Product } from "@jhatpat/shared";
import { AddToCartButton } from "@/components/features/cart/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const off = discountPercent(product.pricePaise, product.mrpPaise);

  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col rounded-2xl bg-surface p-2.5 shadow-card transition-all duration-200 hover:shadow-md border border-border/60",
        className,
      )}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-canvas/70 border border-border/40">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 480px) 11rem, 45vw"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          />
        )}
        {off > 0 && (
          <Badge variant="discount" className="absolute top-1.5 left-1.5 z-10 text-[0.625rem]">
            {off}% OFF
          </Badge>
        )}
        {product.tag && (
          <Badge
            variant={product.tag.toLowerCase() === "organic" ? "organic" : "fresh"}
            className={cn("absolute z-10 text-[0.625rem]", off > 0 ? "top-1.5 right-1.5" : "top-1.5 left-1.5")}
          >
            {product.tag}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="mt-2 flex flex-1 flex-col">
        {/* Product Name */}
        <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-bold leading-snug text-ink sm:text-sm">
          <Link
            href={`/product/${product.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary"
          >
            {product.name}
          </Link>
        </h3>

        {/* Rating and Reviews */}
        <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] text-muted">
          <Star aria-hidden className="size-3 fill-primary text-primary" />
          <span className="font-semibold text-ink">{product.ratingAvg.toFixed(1)}</span>
          <span>({product.ratingCount})</span>
        </p>

        {/* Unit & Subtitle */}
        <p className="mt-0.5 truncate text-[0.6875rem] text-muted">
          {product.unit ? <span className="font-medium text-ink/75">{product.unit}</span> : null}
          {product.unit && product.subtitle ? " · " : ""}
          {product.subtitle}
        </p>

        {/* Price & Add to Cart */}
        <div className="mt-auto flex items-end justify-between gap-1.5 pt-2">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-extrabold text-ink sm:text-base">{formatINR(product.pricePaise)}</span>
            {product.mrpPaise > product.pricePaise && (
              <s className="text-[0.6875rem] text-muted">{formatINR(product.mrpPaise)}</s>
            )}
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
