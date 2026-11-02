import type { Metadata } from "next";

import { OrdersPage } from "@/features/orders/OrdersPages";

export const metadata: Metadata = { title: "My Orders" };

export default function Page() {
  return (
    <OrdersPage />
  );
}
