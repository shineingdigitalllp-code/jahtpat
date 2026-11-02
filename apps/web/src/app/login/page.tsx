import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { SocialAuthButtons } from "@/components/features/auth/SocialAuthButtons";
import { Wordmark } from "@/components/layout/Wordmark";
import loginBg from "../../../public/images/auth/login-bg.png";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden px-6 pt-[max(clamp(1rem,5dvh,3.5rem),env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Image
        src={loginBg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="(min-width: 480px) 480px, 100vw"
        className="-z-10 object-cover object-top"
      />
      <Link href="/" aria-label="Jhatpat home" className="w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
        <Wordmark className="text-[clamp(2.5rem,6.5dvh,3.25rem)]" />
      </Link>
      <p className="mt-2 text-lg leading-snug font-bold">
        Groceries, <span className="rounded bg-primary px-1.5 py-0.5 text-black">Delivered</span>
        <br />
        in Minutes.
      </p>

      <section className="mt-auto pt-6">
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">
          Welcome <span className="rounded bg-primary px-1.5 py-0.5 text-black">Back</span>
        </h1>
        <p className="mt-1 text-[0.9375rem] text-ink/70">Login to continue your jhatpat experience</p>
        <div className="mt-4">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <div className="mt-4">
          <SocialAuthButtons />
        </div>
      </section>

      <p className="pt-4 text-center text-[0.9375rem] text-ink/80">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-black underline decoration-primary decoration-2 underline-offset-2">
          Sign Up
        </Link>
      </p>
    </main>
  );
}
