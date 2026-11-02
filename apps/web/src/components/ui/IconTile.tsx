import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = {
  blue: "bg-ios-blue text-white",
  green: "bg-emerald-500 text-white",
  indigo: "bg-neutral-900 text-white",
  orange: "bg-[#FED843] text-black",
  purple: "bg-purple-600 text-white",
  gray: "bg-neutral-500 text-white",
  red: "bg-red-500 text-white",
  teal: "bg-teal-600 text-white",
  pink: "bg-pink-500 text-white",
  brand: "bg-primary text-black",
};

const SIZES = {
  sm: { tile: "size-7 rounded-lg", icon: "size-4" },
  md: { tile: "size-8 rounded-[0.5625rem]", icon: "size-[1.125rem]" },
  lg: { tile: "size-12 rounded-[0.875rem]", icon: "size-6" },
  xl: { tile: "size-16 rounded-[1.125rem]", icon: "size-8" },
};

export type IconTileColor = keyof typeof COLORS;

type IconTileProps = { icon: LucideIcon; color: IconTileColor; size?: keyof typeof SIZES; className?: string };

export function IconTile({ icon: Icon, color, size = "md", className }: IconTileProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.18)] ring-1 ring-black/5 ring-inset after:absolute after:inset-0 after:bg-linear-to-b after:from-white/30 after:to-transparent after:to-60%",
        COLORS[color],
        SIZES[size].tile,
        className,
      )}
    >
      <Icon className={cn("relative z-10", SIZES[size].icon)} strokeWidth={2.5} />
    </span>
  );
}
