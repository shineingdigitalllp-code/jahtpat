import { ArrowRight, Percent } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@jhatpat/shared";
import { buttonClass } from "@/components/ui/Button";

export function OfferHero({ banner }: { banner: Banner }) {
  return (
    <section className="relative mx-4 grid min-h-40 grid-cols-[1fr_auto] items-center overflow-hidden rounded-card bg-[#FED843] p-4 text-black shadow-cta">
      <div className="relative z-10 min-w-0">
        <h2 className="max-w-44 text-[1.375rem] leading-tight font-extrabold tracking-tight text-black">{banner.title}</h2>
        <p className="mt-1.5 text-sm font-bold text-neutral-800">{banner.subtitle}</p>
        <Link
          href={banner.link}
          className={buttonClass({ size: "sm", className: "mt-3 bg-black text-white font-bold shadow-none hover:bg-neutral-900" })}
        >
          {banner.ctaLabel}
          <ArrowRight aria-hidden className="size-4" strokeWidth={2.5} />
        </Link>
      </div>
      <div className="relative">
        <Image src={banner.image} alt="" width={136} height={136} priority className="size-34 rounded-2xl object-cover" />
        <span className="absolute -top-2 -right-2 grid size-11 place-items-center rounded-full bg-white text-black shadow-card ring-4 ring-black/10">
          <Percent aria-hidden className="size-5 text-black" strokeWidth={3} />
        </span>
      </div>
    </section>
  );
}
