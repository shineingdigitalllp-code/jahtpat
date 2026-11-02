import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CategoryDetail } from "@jhatpat/shared";
import { CategoryListing, type SearchParams } from "@/components/features/category/CategoryListing";
import { api, ApiError } from "@/lib/api";
import { CATALOG_REVALIDATE_S } from "@/lib/constants";

type CategoryPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

const getCategory = (slug: string) =>
  api<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`, { next: { revalidate: CATALOG_REVALIDATE_S } }).catch(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    },
  );

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await getCategory((await params).slug);
  return { title: category.name };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const { children, banner } = await getCategory(slug);
  const active = typeof query.category === "string" ? query.category : undefined;

  return (
    <CategoryListing
      rail={children}
      allHref={`/categories/${slug}`}
      railHref={(category) => `/categories/${slug}?category=${category.slug}`}
      activeSlug={children.some((child) => child.slug === active) ? active : undefined}
      categorySlug={slug}
      banner={banner}
      searchParams={query}
    />
  );
}
