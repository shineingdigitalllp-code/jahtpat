import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QtyStepperProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
};

const BUTTON_SIZES = { xs: "h-7 w-6 rounded-full", sm: "size-9 rounded-chip", md: "size-11 rounded-chip", lg: "size-11 rounded-full" };
const OUTPUT_SIZES = { xs: "w-4 text-xs tabular-nums", sm: "w-7 text-sm", md: "w-10", lg: "w-9 text-base tabular-nums" };

export function QtyStepper({ value, onChange, label, min = 1, max = 99, size = "md" }: QtyStepperProps) {
  const compact = size === "xs";
  const button = cn(
    "relative grid place-items-center transition duration-150 ease-out after:absolute after:-inset-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-90 disabled:opacity-40",
    BUTTON_SIZES[size],
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center",
        compact && "shrink-0 rounded-full bg-primary text-black font-extrabold shadow-cta",
        size === "lg" && "shrink-0 gap-1",
        !compact && size !== "lg" && "rounded-xl border bg-surface",
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn(button, !compact && "text-ink", size === "lg" && "border bg-surface")}
      >
        <Minus aria-hidden className={compact ? "size-3" : "size-4"} strokeWidth={2.5} />
      </button>
      <output aria-live="polite" className={cn("text-center font-bold", OUTPUT_SIZES[size])}>
        {value}
      </output>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={cn(button, !compact && "bg-primary text-black font-extrabold")}
      >
        <Plus aria-hidden className={compact ? "size-3" : "size-4"} strokeWidth={2.5} />
      </button>
    </div>
  );
}
