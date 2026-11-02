import { Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@jhatpat/shared";
import { IconTile } from "@/components/ui/IconTile";

export function OfferTile({ banner }: { banner: Banner }) {
  return (
    <Link
      href={banner.link}
      className="relative flex flex-col overflow-hidden rounded-card bg-linear-to-b from-primary-soft to-surface shadow-card focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="p-3 pr-9">
        <h3 className="text-[0.9375rem] leading-tight font-extrabold text-neutral-950">{banner.title}</h3>
        <p className="mt-0.5 text-xs font-bold text-neutral-700">{banner.subtitle}</p>
      </div>
      <div className="relative mt-auto aspect-[16/9]">
        <Image src={banner.image} alt="" fill sizes="(min-width: 480px) 13rem, 45vw" className="object-cover" />
      </div>
      <IconTile icon={Percent} color="pink" size="sm" className="absolute top-3 right-3" />
    </Link>
  );
}
