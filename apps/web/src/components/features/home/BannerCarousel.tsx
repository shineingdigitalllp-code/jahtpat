"use client";

import { useRef, useState } from "react";
import type { Banner } from "@jhatpat/shared";
import { cn } from "@/lib/utils";
import { BannerCard } from "./BannerCard";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const track = trackRef.current;
    if (track) setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-roledescription="carousel" aria-label="Offers" className="relative mx-4">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-card border border-primary/15 shadow-card"
      >
        {banners.map((banner, index) => (
          <li
            key={banner.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${banners.length}`}
            className="w-full shrink-0 snap-center"
          >
            <BannerCard banner={banner} priority={index === 0} className="h-full pb-7" />
          </li>
        ))}
      </ul>
      {banners.length > 1 && (
        <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className="relative grid h-1.5 place-items-center after:absolute after:-inset-2"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  index === active ? "w-4 bg-primary" : "w-1.5 bg-ink/15",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
