import type { ProductSort } from "@jhatpat/shared";

export const ORGANIC_TAG = "Organic";
export const BEST_RATED_MIN = 4.5;

export const SORT_LABELS: Record<ProductSort, string> = {
  popular: "Popular",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  rating: "Rating",
};
