import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-black text-white font-bold shadow-md hover:bg-neutral-900",
  accent: "bg-primary text-black font-bold shadow-cta hover:bg-primary-strong",
  outline: "border bg-surface text-ink shadow-card hover:bg-primary-soft",
  danger: "border border-danger/30 bg-danger-soft text-danger hover:bg-danger/10",
  ghost: "text-ink hover:bg-primary-soft",
  glass: "glass text-ink shadow-card hover:bg-surface/90",
};

const SIZES = {
  sm: "relative h-9 gap-1.5 rounded-full px-4 text-sm after:absolute after:-inset-1",
  md: "h-11 gap-2 rounded-2xl px-4 text-sm",
  lg: "h-14 gap-3 rounded-full px-6 text-base",
  icon: "size-11 rounded-full",
};

type ButtonStyle = { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES; className?: string };

export const buttonClass = ({ variant = "primary", size = "md", className }: ButtonStyle) =>
  cn(
    "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition duration-200 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

type ButtonProps = ComponentProps<"button"> & ButtonStyle & { pending?: boolean };

export function Button({
  variant,
  size,
  pending = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
