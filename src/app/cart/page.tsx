import type { Metadata } from "next";

import CartPage from "@/features/orders/CartPage";

export const metadata: Metadata = { title: "Your Cart" };

export default function Page() {
  return (
    <CartPage />
  );
}
