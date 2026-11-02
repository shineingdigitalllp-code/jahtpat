import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Cart", "Payment", "Order Placed"];
const CURRENT = 1;

export function CheckoutSteps() {
  return (
    <ol aria-label="Checkout progress" className="flex items-center px-8 pb-4">
      {STEPS.map((step, index) => {
        const done = index < CURRENT;
        const current = index === CURRENT;
        return (
          <li key={step} className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "grid size-7 place-items-center rounded-full text-xs font-bold",
                  done && "bg-ink text-primary",
                  current && "bg-surface text-ink shadow-card ring-2 ring-ink",
                  !done && !current && "bg-surface/60 text-ink/50",
                )}
              >
                {done ? <Check aria-hidden className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              <span className={cn("text-[0.6875rem] whitespace-nowrap", current ? "font-bold text-ink" : "text-ink/60")}>
                {step}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span aria-hidden className={cn("mx-2 mb-4 h-0.5 flex-1 rounded-full", done ? "bg-ink" : "bg-ink/15")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
