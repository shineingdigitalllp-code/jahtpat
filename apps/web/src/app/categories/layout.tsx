import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

export default function CategoriesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="pb-[calc(9rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}

