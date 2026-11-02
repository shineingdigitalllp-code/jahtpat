import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const chipClass = (pressed = false, className?: string) =>
  cn(
    "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/70 bg-surface/75 px-3.5 text-xs font-medium shadow-[0_1px_3px_rgb(17_17_17/0.06)] backdrop-blur-md transition-colors duration-200 after:absolute after:-inset-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    pressed ? "border-primary bg-primary-soft text-primary" : "text-ink",
    className,
  );

type ChipProps = ComponentProps<"button"> & { pressed?: boolean };

export function Chip({ pressed, className, type = "button", ...props }: ChipProps) {
  return <button type={type} aria-pressed={pressed} className={chipClass(pressed, className)} {...props} />;
}
