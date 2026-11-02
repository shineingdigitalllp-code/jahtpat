import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <form
      role="search"
      action="/categories"
      className="mt-4 flex h-13 items-center gap-3 rounded-2xl border border-white/70 bg-surface/80 px-4 shadow-card backdrop-blur-md transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"
    >
      <Search aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
      <input
        type="search"
        name="q"
        aria-label="Search products"
        placeholder="Search for vegetables, groceries & more"
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
      />
    </form>
  );
}
