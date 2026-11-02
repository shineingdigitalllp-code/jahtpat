import type { Metadata } from "next";
import Link from "next/link";
import { COUPON_CATEGORIES, type CouponCategory, type OffersData } from "@jhatpat/shared";
import { SectionHeader } from "@/components/features/home/SectionHeader";
import { CouponCard } from "@/components/features/offers/CouponCard";
import { OfferHero } from "@/components/features/offers/OfferHero";
import { OfferTile } from "@/components/features/offers/OfferTile";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { chipClass } from "@/components/ui/Chip";
import { api } from "@/lib/api";
import { CATALOG_REVALIDATE_S } from "@/lib/constants";

export const metadata: Metadata = { title: "Offers" };

const FILTERS: { label: string; value?: CouponCategory }[] = [
  { label: "All Offers" },
  { label: "Bank Offers", value: "bank" },
  { label: "Wallet Offers", value: "wallet" },
  { label: "Combo Offers", value: "combo" },
];

type OffersPageProps = { searchParams: Promise<{ type?: string }> };

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const { type } = await searchParams;
  const active = COUPON_CATEGORIES.find((category) => category === type);
  const { banners, coupons } = await api<OffersData>("/offers", { next: { revalidate: CATALOG_REVALIDATE_S } });
  const [hero, ...moreOffers] = banners;
  const visible = active ? coupons.filter((coupon) => coupon.category === active) : coupons;

  return (
    <>
      <BrandHeader />
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-[1.625rem] font-extrabold tracking-tight">Offers</h1>
        <p className="text-sm text-muted">Save more on your daily essentials</p>
      </div>
      {hero && <OfferHero banner={hero} />}
      <nav aria-label="Offer types" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 py-1">
        {FILTERS.map(({ label, value }) => {
          const selected = value === active;
          return (
            <Link
              key={label}
              href={value ? `/offers?type=${value}` : "/offers"}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={chipClass(false, selected ? "border-primary bg-primary text-black font-black shadow-sm" : "")}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <section aria-label="Coupons" className="mt-3 flex flex-col gap-3 px-4">
        {visible.length > 0 ? (
          visible.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />)
        ) : (
          <p className="rounded-card bg-surface py-10 text-center text-sm text-muted">
            No offers here right now. Check back soon.
          </p>
        )}
      </section>
      {moreOffers.length > 0 && (
        <section className="mt-5 pb-4">
          <SectionHeader title="More Offers for You" href="/categories" />
          <div className="grid grid-cols-2 gap-3 px-4">
            {moreOffers.map((banner) => (
              <OfferTile key={banner.id} banner={banner} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
