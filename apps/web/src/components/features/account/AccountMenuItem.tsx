import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

type AccountMenuItemProps = {
  href: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  badge?: string;
};

export function AccountMenuItem({
  href,
  icon: Icon,
  iconBg = "bg-neutral-100",
  iconColor = "text-neutral-900",
  title,
  subtitle,
  badge,
}: AccountMenuItemProps) {
  return (
    <li className="group">
      <Link
        href={href}
        className="flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50/80 active:bg-neutral-100/80"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs ring-1 ring-black/5 ${iconBg} ${iconColor}`}
        >
          <Icon className="size-5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-neutral-950">{title}</span>
            {badge && (
              <span className="rounded-full bg-[#FED843] px-2 py-0.5 text-[10px] font-black text-black">
                {badge}
              </span>
            )}
          </div>
          <span className="block truncate text-xs font-medium text-neutral-500">{subtitle}</span>
        </div>

        <ChevronRight aria-hidden className="size-4 shrink-0 text-neutral-400 group-hover:text-neutral-600 transition" strokeWidth={2.5} />
      </Link>
    </li>
  );
}
