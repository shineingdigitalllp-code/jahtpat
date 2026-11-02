import { Check } from "lucide-react";
import type { ProductSort } from "@jhatpat/shared";
import { cn } from "@/lib/utils";
import { SORT_LABELS } from "./filter-options";

type SortOptionsProps = { value: ProductSort; onChange: (sort: ProductSort) => void };

export function SortOptions({ value, onChange }: SortOptionsProps) {
  return (
    <div role="radiogroup" aria-label="Sort by" className="flex flex-col gap-2">
      {(Object.entries(SORT_LABELS) as [ProductSort, string][]).map(([option, label]) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              "flex h-12 items-center justify-between rounded-2xl border px-4 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              selected ? "border-primary bg-primary-soft font-semibold text-ink" : "border-ink/10 text-ink/80 hover:bg-primary-soft",
            )}
          >
            {label}
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full transition-colors duration-200",
                selected ? "bg-primary text-black" : "border border-ink/20",
              )}
            >
              {selected && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
