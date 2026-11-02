import { DeliveryLocation } from "@/components/features/address/DeliveryLocation";
import { CartLink } from "@/components/features/cart/CartLink";
import { BackButton } from "./BackButton";

export function Header() {
  return (
    <header className="glass-bar sticky top-0 z-30 grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 pt-3 pb-2">
      <BackButton />
      <div className="flex min-w-0 justify-center">
        <DeliveryLocation variant="pill" />
      </div>
      <CartLink />
    </header>
  );
}
