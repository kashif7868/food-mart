import { Suspense } from "react";

import Loading from "../../loading";
import { OrderPage } from "@/features/orders/OrdersPages";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <OrderPage id={id} />
    </Suspense>
  );
}
