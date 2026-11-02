import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display leading-none font-black tracking-tight", className)}>
      jhat<span className="text-primary">pat</span>
    </span>
  );
}
