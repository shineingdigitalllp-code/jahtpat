import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <Link
        href={href}
        className="flex h-11 items-center gap-1 text-xs font-bold text-neutral-900 transition hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-primary"
      >
        See all
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
