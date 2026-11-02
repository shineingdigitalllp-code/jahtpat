import { UserRound } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";

export function LoginPrompt({ message, next }: { message: string; next: string }) {
  return (
    <section className="mx-4 mt-6 flex flex-col items-center rounded-card bg-surface px-6 py-10 text-center shadow-card">
      <IconTile icon={UserRound} color="brand" size="xl" />
      <h2 className="mt-4 text-lg font-bold">Log in to continue</h2>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonClass({ size: "lg", className: "mt-6 w-full" })}>
        Log in
      </Link>
    </section>
  );
}
