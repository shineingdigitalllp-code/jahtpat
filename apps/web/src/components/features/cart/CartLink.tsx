"use client";

import { ShoppingCart } from "lucide-react";
import { HeaderIconLink } from "@/components/layout/HeaderIconLink";
import { useCartCount } from "@/store/cart-store";

export function CartLink() {
  return <HeaderIconLink href="/cart" label="Cart" icon={ShoppingCart} count={useCartCount()} />;
}
