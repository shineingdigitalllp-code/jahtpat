import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  discount: "rounded-md bg-primary px-1.5 py-0.5 text-[0.625rem] font-bold tracking-wide text-black shadow-sm",
  organic: "rounded-full bg-positive px-2 py-0.5 text-[0.625rem] font-bold text-white shadow-sm",
  fresh: "rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-bold text-black shadow-sm",
  count:
    "h-[1.125rem] min-w-[1.125rem] justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-black ring-2 ring-surface",
};

type BadgeProps = ComponentProps<"span"> & { variant: keyof typeof VARIANTS };

export function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center", VARIANTS[variant], className)} {...props} />;
}
