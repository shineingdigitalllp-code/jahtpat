"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/constants";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null);
    router.refresh();
    setPending(false);
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      aria-busy={pending || undefined}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 text-sm font-bold text-red-600 shadow-xs transition hover:bg-red-100/70 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="size-4.5" strokeWidth={2.25} />
      )}
      <span>Log Out</span>
    </button>
  );
}
