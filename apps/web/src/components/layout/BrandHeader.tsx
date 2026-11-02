import Link from "next/link";
import { DeliveryLocation } from "@/components/features/address/DeliveryLocation";
import { CartLink } from "@/components/features/cart/CartLink";
import { Wordmark } from "./Wordmark";

export function BrandHeader() {
  return (
    <header className="glass-bar sticky top-0 z-30 flex items-center gap-3 px-4 pt-3 pb-2">
      <Link href="/" aria-label="Jhatpat home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
        <Wordmark className="text-[1.75rem]" />
      </Link>
      <DeliveryLocation variant="compact" />
      <CartLink />
    </header>
  );
}
