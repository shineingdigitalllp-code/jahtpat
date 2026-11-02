"use client";

import { ChevronDown, Leaf, Search, SlidersHorizontal, Star, X } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProductSort } from "@jhatpat/shared";
import { Chip } from "@/components/ui/Chip";
import type { FilterSheetView } from "./FilterSheet";
import { BEST_RATED_MIN, ORGANIC_TAG, SORT_LABELS } from "./filter-options";

const FilterSheet = dynamic(() => import("./FilterSheet").then((mod) => mod.FilterSheet), { ssr: false });

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<FilterSheetView>("filter");

  const sort = (searchParams.get("sort") ?? "popular") as ProductSort;
  const organic = searchParams.get("tag") === ORGANIC_TAG;
  const bestRated = searchParams.has("minRating");
  const hasFilters = searchParams.size > 0 || pathname !== "/categories";

  const openSheet = (view: FilterSheetView) => {
    setSheetView(view);
    setSheetOpen(true);
  };

  const update = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  useEffect(() => {
    if (query.trim() === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: query.trim() || undefined }), 300);
    return () => clearTimeout(timer);
  });

  const filterState = {
    sort,
    organic,
    bestRated,
    onSort: (value: ProductSort) => update({ sort: value === "popular" ? undefined : value }),
    onOrganic: () => update({ tag: organic ? undefined : ORGANIC_TAG }),
    onBestRated: () => update({ minRating: bestRated ? undefined : String(BEST_RATED_MIN) }),
    onClear: () => {
      setQuery("");
      router.replace("/categories", { scroll: false });
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/70 bg-surface/80 pr-1.5 pl-3.5 shadow-card backdrop-blur-md focus-within:ring-2 focus-within:ring-primary/30">
        <Search aria-hidden className="size-4 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search products"
          placeholder="Search for fruits, vegetables..."
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => openSheet("filter")}
          aria-label="Open filters"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
        </button>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        <Chip onClick={() => openSheet("filter")}>
          <SlidersHorizontal aria-hidden className="size-3.5" />
          Filter
        </Chip>
        <Chip pressed={sort !== "popular"} onClick={() => openSheet("sort")} aria-haspopup="dialog" className="pr-2.5">
          {sort === "popular" ? "Sort by" : SORT_LABELS[sort]}
          <ChevronDown aria-hidden className="size-3.5" />
        </Chip>
        <Chip pressed={organic} onClick={filterState.onOrganic}>
          <Leaf aria-hidden className="size-3.5 text-success" />
          Organic
        </Chip>
        <Chip pressed={bestRated} onClick={filterState.onBestRated}>
          <Star aria-hidden className="size-3.5 fill-primary text-primary" />
          Best Rated
        </Chip>
        <Chip onClick={filterState.onClear} disabled={!hasFilters} className="disabled:opacity-50">
          <X aria-hidden className="size-3.5" />
          Clear
        </Chip>
      </div>
      <FilterSheet open={sheetOpen} view={sheetView} onClose={() => setSheetOpen(false)} hasFilters={hasFilters} {...filterState} />
    </div>
  );
}
