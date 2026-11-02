import { Heart, ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ONBOARDED_COOKIE } from "@/lib/constants";
import welcomeBg from "../../../public/images/welcome-bg.png";

export const metadata: Metadata = { title: "Welcome — Jhatpat" };

async function getStarted() {
  "use server";
  (await cookies()).set(ONBOARDED_COOKIE, "1", {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-gradient-to-b from-[#FED843] via-[#FED843]/65 via-35% to-white">
      {/* Top safe area spacing */}
      <div className="pt-[max(1rem,env(safe-area-inset-top))]" />

      {/* Center Showcase Card Graphic with Doodles */}
      <div className="relative mx-auto flex w-full max-w-[22.5rem] flex-1 items-center justify-center px-4 py-2">
        {/* Top-Right Curved Doodle Arrow & Cart Badge */}
        <div className="pointer-events-none absolute -top-1 right-2 z-20 flex flex-col items-center">
          {/* Curved SVG arrow swooping down */}
          <svg
            className="h-16 w-16 -mb-1 text-[#E5A600]"
            viewBox="0 0 60 60"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.75}
            strokeLinecap="round"
          >
            <path d="M 10 16 C 36 2, 54 14, 46 42" />
            <path d="M 40 37 L 46 44 L 53 38" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
          </svg>
          {/* Yellow Cart Badge */}
          <div className="flex size-11 items-center justify-center rounded-full bg-[#FED843] shadow-md ring-2 ring-white">
            <ShoppingCart className="size-5 text-black" strokeWidth={2.5} />
          </div>
        </div>

        {/* Center Welcome Graphic */}
        <div className="relative h-[clamp(13rem,44dvh,28rem)] w-full drop-shadow-xl">
          <Image
            src={welcomeBg}
            alt="Snacks delivered anytime"
            fill
            priority
            className="object-contain"
            sizes="(max-width: 480px) 100vw, 22.5rem"
          />
        </div>

        {/* Bottom-Left Curved Doodle Arrow & Heart Badge */}
        <div className="pointer-events-none absolute -bottom-1 left-2 z-20 flex items-center">
          {/* Coral / Peach Heart Badge */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF9466] shadow-md ring-2 ring-white">
            <Heart className="size-4.5 fill-black text-black" strokeWidth={2} />
          </div>
          {/* Curved SVG arrow swooping up */}
          <svg
            className="h-14 w-20 text-[#E5A600]"
            viewBox="0 0 80 50"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.75}
            strokeLinecap="round"
          >
            <path d="M 10 32 C 30 46, 54 44, 68 18" />
            <path d="M 58 18 L 68 16 L 71 26" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
          </svg>
        </div>
      </div>

      {/* Typography & CTA Footer */}
      <div className="w-full px-6 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Bold + Thin Display Heading */}
        <h1 className="text-[clamp(2.125rem,5.5dvh,2.65rem)] leading-[1.08] tracking-tight">
          <span className="block font-black text-black">Your Favorite</span>
          <span className="font-black text-black">Treats, </span>
          <span className="font-light text-neutral-800">Anytime</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm font-medium text-neutral-500">
          Snacks delivered fast, fresh, anytime.
        </p>

        {/* Black Action Button: "Get Start" */}
        <form action={getStarted} className="mt-[clamp(1rem,3dvh,1.75rem)] w-full">
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center rounded-full bg-black text-base font-bold text-white shadow-xl transition-all duration-200 hover:bg-neutral-900 active:scale-[0.98]"
          >
            Get Start
          </button>
        </form>
      </div>
    </main>
  );
}
