import type { Metadata } from "next";
import { CartView } from "@/components/features/cart/CartView";

export const metadata: Metadata = {
  title: "My Cart",
  description: "Fresh groceries, delivered in minutes.",
};

export default function CartPage() {
  return <CartView />;
}

