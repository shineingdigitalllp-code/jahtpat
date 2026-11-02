"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted">Please check your connection and try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
