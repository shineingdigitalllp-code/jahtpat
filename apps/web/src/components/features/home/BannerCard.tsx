import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@jhatpat/shared";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type BannerCardProps = { banner: Banner; priority?: boolean; className?: string };

export function BannerCard({ banner, priority = false, className }: BannerCardProps) {
  return (
    <div
      className={cn(
        "@container grid grid-cols-[1fr_auto] items-center gap-2 bg-linear-to-br from-primary-soft via-accent-soft to-primary/20 p-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-lg leading-tight font-black text-ink @xs:text-[1.375rem]">{banner.title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink/80 font-medium">{banner.subtitle}</p>
        <Link href={banner.link} className={buttonClass({ size: "sm", className: "mt-3" })}>
          {banner.ctaLabel}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <Image
        src={banner.image}
        alt=""
        width={128}
        height={128}
        priority={priority}
        className="size-24 rounded-2xl object-cover shadow-card @xs:size-34"
      />
    </div>
  );
}
