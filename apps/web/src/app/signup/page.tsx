import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "@/components/features/auth/SignupForm";
import { SocialAuthButtons } from "@/components/features/auth/SocialAuthButtons";
import { Wordmark } from "@/components/layout/Wordmark";
import signupBg from "../../../public/images/auth/signup-bg.png";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Image
        src={signupBg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="(min-width: 480px) 480px, 100vw"
        className="-z-10 object-cover object-top"
      />
      <div className="relative flex items-center justify-center">
        <Link
          href="/login"
          aria-label="Back to login"
          className="absolute left-0 grid size-11 place-items-center rounded-full bg-surface/85 shadow-card backdrop-blur focus-visible:outline-2 focus-visible:outline-primary"
      >
          <ChevronLeft aria-hidden className="size-6" strokeWidth={2.25} />
        </Link>
        <Link href="/" aria-label="Jhatpat home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          <Wordmark className="text-[clamp(2.25rem,5.5dvh,2.75rem)]" />
        </Link>
      </div>
      <p className="mt-1 text-center text-sm font-semibold">
          Groceries, <span className="rounded bg-primary px-1.5 py-0.5 text-black">Delivered</span> in Minutes.
      </p>

      <section className="mt-auto pt-4">
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">
          Create Your <span className="rounded bg-primary px-1.5 py-0.5 text-black">Account</span>
        </h1>
        <p className="mt-1 text-[0.9375rem] text-ink/70">Fresh groceries delivered to your doorstep.</p>
        <div className="mt-3">
          <Suspense>
            <SignupForm />
          </Suspense>
        </div>
        <div className="mt-3">
          <SocialAuthButtons />
        </div>
      </section>

      <p className="pt-3 text-center text-[0.9375rem] text-ink/80">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-black underline decoration-primary decoration-2 underline-offset-2">
          Login
        </Link>
      </p>
    </main>
  );
}
