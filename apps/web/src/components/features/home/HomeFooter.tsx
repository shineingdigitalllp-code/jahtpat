import { Wordmark } from "@/components/layout/Wordmark";

export function HomeFooter() {
  return (
    <footer className="px-6 pt-6 pb-2">
      <Wordmark className="block text-[3.5rem] text-ink/15 [&>span]:text-primary-strong/40" />
      <p className="mt-2 text-sm font-semibold text-muted">Groceries, delivered in minutes.</p>
    </footer>
  );
}
