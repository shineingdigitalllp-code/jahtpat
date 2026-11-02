import type { HomeData } from "@jhatpat/shared";
import { CategoryTile } from "@/components/features/category/CategoryTile";
import { BannerCarousel } from "@/components/features/home/BannerCarousel";
import { CategoryGrid } from "@/components/features/home/CategoryGrid";
import { HomeFooter } from "@/components/features/home/HomeFooter";
import { OfferStrip } from "@/components/features/home/OfferStrip";
import { SectionHeader } from "@/components/features/home/SectionHeader";
import { DealCard } from "@/components/features/product/DealCard";
import { ProductCard } from "@/components/features/product/ProductCard";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { api } from "@/lib/api";
import { CATALOG_REVALIDATE_S, DEALS_TITLE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { banners, categories, deals, bestSellers, topRated, freshPicks, coupons } = await api<HomeData>("/home", {
    next: { revalidate: CATALOG_REVALIDATE_S },
  });

  return (
    <>
      <HomeHeader />
      <nav aria-label="Categories" className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
        <CategoryTile href="/categories" label="All" active />
        {categories.map((category) => (
          <CategoryTile
            key={category.id}
            href={`/categories/${category.slug}`}
            label={category.name}
            image={category.image}
          />
        ))}
      </nav>
      <div className="mt-2 flex flex-col gap-4 pb-4">
        {banners.length > 0 && <BannerCarousel banners={banners} />}
        {deals.length > 0 && (
          <section>
            <SectionHeader title={DEALS_TITLE} href="/offers" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-1 pb-3">
              {deals.map((product) => (
                <DealCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
        {bestSellers.length > 0 && (
          <section>
            <SectionHeader title="Best Sellers" href="/categories" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-1 pb-3">
              {bestSellers.map((category) => (
                <CategoryTile
                  key={category.id}
                  href={`/categories/${category.parentSlug}?category=${category.slug}`}
                  label={category.name}
                  image={category.image}
                  className="w-[4.5rem]"
                />
              ))}
            </div>
          </section>
        )}
        {coupons.length > 0 && (
          <section>
            <SectionHeader title="Offers for you" href="/offers" />
            <OfferStrip coupons={coupons} />
          </section>
        )}
        {categories.length > 0 && (
          <section>
            <SectionHeader title="Shop by category" href="/categories" />
            <CategoryGrid categories={categories} />
          </section>
        )}
        {topRated.length > 0 && (
          <section>
            <SectionHeader title="Top rated" href="/categories?sort=rating" />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pt-1 pb-3">
              {topRated.map((product) => (
                <DealCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
        {freshPicks.length > 0 && (
          <section className="mx-4 rounded-3xl bg-primary-soft py-3 ring-1 ring-primary/40 ring-inset">
            <SectionHeader title="Fresh & organic picks" href="/categories?tag=Organic" />
            <div className="grid grid-cols-2 gap-3 px-3">
              {freshPicks.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
        <HomeFooter />
      </div>
    </>
  );
}
