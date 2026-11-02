import { Percent } from "lucide-react";
import Image from "next/image";
import type { Coupon, CouponCategory } from "@jhatpat/shared";
import { IconTile, type IconTileColor } from "@/components/ui/IconTile";
import { ApplyCouponButton } from "./ApplyCouponButton";

const CATEGORY_COLOR: Record<CouponCategory, IconTileColor> = { general: "orange", bank: "blue", wallet: "green", combo: "purple" };

export function CouponCard({ coupon }: { coupon: Coupon }) {
  return (
    <article className="relative flex gap-3 rounded-card bg-surface p-3 shadow-card">
      <Image src={coupon.image} alt="" width={72} height={72} className="size-18 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <h3 className="pr-8 text-lg leading-tight font-black tracking-tight text-neutral-950">{coupon.title}</h3>
        <p className="mt-0.5 text-xs font-medium text-neutral-500">{coupon.subtitle}</p>
        <div className="mt-2.5 flex items-center gap-2">
          <p className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/80 px-2.5 text-[0.6875rem] font-medium text-neutral-600">
            Use Code
            <span className="truncate text-xs font-black tracking-wide text-neutral-950">{coupon.code}</span>
          </p>
          <ApplyCouponButton code={coupon.code} />
        </div>
      </div>
      <IconTile icon={Percent} color={CATEGORY_COLOR[coupon.category]} size="sm" className="absolute top-3 right-3" />
    </article>
  );
}
