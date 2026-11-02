import type { LucideIcon } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconTile, type IconTileColor } from "./IconTile";

type InputProps = ComponentProps<"input"> & {
  label: string;
  hideLabel?: boolean;
  error?: string;
  icon?: LucideIcon;
  iconColor?: IconTileColor;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Input({ label, hideLabel = false, error, icon, iconColor = "gray", leading, trailing, id, className, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <div
        className={cn(
          "flex min-h-14 items-center gap-3 rounded-2xl border border-white/70 bg-surface/80 pl-3 shadow-card backdrop-blur-md transition duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15",
          !trailing && "pr-4",
          error && "border-danger",
        )}
      >
        {icon && <IconTile icon={icon} color={iconColor} size="sm" />}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-1.5">
          <label htmlFor={inputId} className={hideLabel ? "sr-only" : "text-xs font-medium"}>
            {label}
          </label>
          <div className="flex items-center gap-2.5">
            {leading}
            <input
              id={inputId}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                "h-7 min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted/80",
                className,
              )}
              {...props}
            />
          </div>
        </div>
        {trailing}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 pl-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
