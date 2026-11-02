import type { ReactNode } from "react";
import { BackButton } from "./BackButton";

type TitleHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  back?: boolean;
  action?: ReactNode;
  children?: ReactNode;
};

export function TitleHeader({ title, subtitle, back = false, action, children }: TitleHeaderProps) {
  return (
    <header className="sticky top-0 z-30 mb-4 rounded-b-[1.75rem] bg-linear-to-b from-primary to-primary-soft pt-[max(0.75rem,env(safe-area-inset-top))] shadow-card">
      <div className="grid min-h-14 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pb-3">
        {back ? <BackButton /> : <span />}
        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-extrabold tracking-tight text-ink">{title}</h1>
          {subtitle && <div className="text-[0.6875rem] font-semibold text-ink/70">{subtitle}</div>}
        </div>
        {action ?? <span />}
      </div>
      {children}
    </header>
  );
}
