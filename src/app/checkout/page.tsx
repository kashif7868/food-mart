import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import CheckoutPage from "@/features/orders/CheckoutPage";

export const metadata: Metadata = { title: "Checkout" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutPage />
    </Suspense>
  );
}
