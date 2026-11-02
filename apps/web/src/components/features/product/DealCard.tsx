import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@jhatpat/shared";
import { AddToCartButton } from "@/components/features/cart/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DealCard({ product, className }: { product: ProductCard; className?: string }) {
  const off = discountPercent(product.pricePaise, product.mrpPaise);

  return (
    <article
      className={cn(
        "group relative flex w-36 shrink-0 flex-col rounded-2xl bg-surface p-2.5 shadow-card transition-all duration-200 hover:shadow-md border border-border/60 sm:w-40",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-canvas/70 border border-border/40">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="10rem"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          />
        )}
        {off > 0 && (
          <Badge variant="discount" className="absolute top-1.5 left-1.5 z-10 text-[0.625rem]">
            {off}% OFF
          </Badge>
        )}
      </div>

      <div className="mt-2 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[2rem] text-xs font-semibold leading-snug text-ink sm:text-sm">
          <Link
            href={`/product/${product.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary"
          >
            {product.name}
          </Link>
        </h3>
        {product.unit && (
          <p className="mt-0.5 truncate text-[0.6875rem] text-muted">{product.unit}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-1 pt-2">
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-bold text-ink">{formatINR(product.pricePaise)}</span>
            {off > 0 && <s className="text-[0.6875rem] text-muted">{formatINR(product.mrpPaise)}</s>}
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
