import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CategoryTileProps = { href: string; label: string; image?: string; active?: boolean; className?: string };

export function CategoryTile({ href, label, image, active = false, className }: CategoryTileProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-16 shrink-0 flex-col items-center gap-1 rounded-chip border bg-surface px-1 pt-1.5 pb-1.5 text-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active ? "border-primary bg-primary-soft" : "hover:border-primary/40",
        className,
      )}
    >
      {image ? (
        <Image src={image} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" />
      ) : (
        <span className="grid size-11 place-items-center rounded-lg bg-primary text-black font-extrabold">
          <ShoppingBag aria-hidden className="size-6" strokeWidth={2} />
        </span>
      )}
      <span
        className={cn("line-clamp-2 text-[0.625rem] leading-tight font-medium", active ? "font-bold text-neutral-950" : "text-neutral-700")}
      >
        {label}
      </span>
    </Link>
  );
}
