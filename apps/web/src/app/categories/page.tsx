import type { Metadata } from "next";
import type { Category, HomeData } from "@jhatpat/shared";
import { CategoryListing, type SearchParams } from "@/components/features/category/CategoryListing";
import { api } from "@/lib/api";
import { CATALOG_REVALIDATE_S } from "@/lib/constants";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

const railHref = (category: Category) => `/categories/${category.slug}`;

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { categories, banners } = await api<HomeData>("/home", { next: { revalidate: CATALOG_REVALIDATE_S } });

  return (
    <CategoryListing
      rail={categories}
      allHref="/categories"
      railHref={railHref}
      banner={banners[0] ?? null}
      searchParams={await searchParams}
    />
  );
}
