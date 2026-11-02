"use client";

import { Leaf, Star } from "lucide-react";
import type { ProductSort } from "@jhatpat/shared";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { SortOptions } from "./SortOptions";

export type FilterSheetView = "filter" | "sort";

type FilterSheetProps = {
  open: boolean;
  view: FilterSheetView;
  onClose: () => void;
  sort: ProductSort;
  organic: boolean;
  bestRated: boolean;
  hasFilters: boolean;
  onSort: (sort: ProductSort) => void;
  onOrganic: () => void;
  onBestRated: () => void;
  onClear: () => void;
};

export function FilterSheet({
  open,
  view,
  onClose,
  sort,
  organic,
  bestRated,
  hasFilters,
  onSort,
  onOrganic,
  onBestRated,
  onClear,
}: FilterSheetProps) {
  if (view === "sort") {
    return (
      <Sheet open={open} onClose={onClose} title="Sort by">
        <SortOptions
          value={sort}
          onChange={(value) => {
            onSort(value);
            onClose();
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title="Filter & Sort">
      <p className="text-sm font-semibold">Sort by</p>
      <div className="mt-2">
        <SortOptions value={sort} onChange={onSort} />
      </div>
      <p className="mt-5 text-sm font-semibold">Show only</p>
      <div className="mt-2 flex gap-2">
        <Chip pressed={organic} onClick={onOrganic}>
          <Leaf aria-hidden className="size-3.5 text-success" />
          Organic
        </Chip>
        <Chip pressed={bestRated} onClick={onBestRated}>
          <Star aria-hidden className="size-3.5 fill-primary text-primary" />
          Best Rated
        </Chip>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" disabled={!hasFilters} onClick={onClear}>
          Clear all
        </Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Sheet>
  );
}
