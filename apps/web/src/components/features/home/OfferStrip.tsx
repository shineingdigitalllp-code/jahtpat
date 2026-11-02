import Image from "next/image";
import Link from "next/link";
import type { Coupon } from "@jhatpat/shared";

export function OfferStrip({ coupons }: { coupons: Coupon[] }) {
  return (
    <ul className="no-scrollbar flex snap-x scroll-pl-4 gap-3 overflow-x-auto pb-1 pl-4 after:w-1 after:shrink-0 after:content-['']">
      {coupons.map((coupon) => (
        <li key={coupon.id} className="w-[17rem] shrink-0 snap-start">
          <Link
            href="/offers"
            className="flex h-full min-h-28 overflow-hidden rounded-card bg-ink text-white shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex min-w-0 flex-1 flex-col p-4">
              <span className="line-clamp-2 text-base leading-tight font-extrabold text-primary">{coupon.title}</span>
              <span className="mt-1 truncate text-xs text-white/70">{coupon.subtitle}</span>
              <span className="mt-auto self-start rounded-md border border-dashed border-primary/60 px-2 py-0.5 text-[0.6875rem] font-bold tracking-wider">
                {coupon.code}
              </span>
            </span>
            <span aria-hidden className="my-3 border-l-2 border-dashed border-white/20" />
            <span className="grid w-20 shrink-0 place-items-center">
              <span className="relative size-14 overflow-hidden rounded-full ring-2 ring-primary">
                <Image src={coupon.image} alt="" fill sizes="3.5rem" className="object-cover" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
