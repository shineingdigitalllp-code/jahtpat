import { productQuerySchema, type Banner, type Category, type ProductPage } from "@jhatpat/shared";
import { BannerCard } from "@/components/features/home/BannerCard";
import { ProductGrid } from "@/components/features/product/ProductGrid";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { toQueryString } from "@/lib/utils";
import { CategoryTile } from "./CategoryTile";
import { ProductFilters } from "./ProductFilters";

export type SearchParams = Record<string, string | string[] | undefined>;

type CategoryListingProps = {
  rail: Category[];
  allHref: string;
  railHref: (category: Category) => string;
  activeSlug?: string;
  categorySlug?: string;
  banner: Banner | null;
  searchParams: SearchParams;
};

const pick = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export async function CategoryListing({
  rail,
  allHref,
  railHref,
  activeSlug,
  categorySlug,
  banner,
  searchParams,
}: CategoryListingProps) {
  const parsed = productQuerySchema.safeParse({
    category: activeSlug ?? categorySlug,
    q: pick(searchParams.q),
    sort: pick(searchParams.sort),
    tag: pick(searchParams.tag),
    minRating: pick(searchParams.minRating),
  });
  const filters = parsed.success ? parsed.data : productQuerySchema.parse({ category: activeSlug ?? categorySlug });
  const initialPage = await api<ProductPage>(`/products?${toQueryString(filters)}`, { cache: "no-store" });

  return (
    <>
      <Header />
      <div className="grid grid-cols-[4.5rem_1fr] gap-3 px-4 pb-6">
        <nav aria-label="Subcategories" className="sticky top-[4.5rem] flex max-h-[calc(100dvh-13.5rem-env(safe-area-inset-bottom))] flex-col gap-2 self-start overflow-y-auto rounded-card bg-surface p-1.5 shadow-card no-scrollbar">
          <CategoryTile href={allHref} label="All" active={!activeSlug} className="w-full" />
          {rail.map((category) => (
            <CategoryTile
              key={category.id}
              href={railHref(category)}
              label={category.name}
              image={category.image}
              active={category.slug === activeSlug}
              className="w-full"
            />
          ))}
        </nav>
        <main className="min-w-0 space-y-3">
          {banner && <BannerCard banner={banner} priority className="rounded-card" />}
          <ProductFilters />
          <ProductGrid key={JSON.stringify(filters)} filters={filters} initialPage={initialPage} />
        </main>
      </div>
    </>
  );
}
