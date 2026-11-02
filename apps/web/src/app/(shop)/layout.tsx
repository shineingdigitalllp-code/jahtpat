import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-dvh flex-col pb-[calc(9rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}
