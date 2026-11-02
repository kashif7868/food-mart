import type { Metadata } from "next";

import OffersPage from "@/features/discovery/OffersPage";

export const metadata: Metadata = { title: "Special Offers" };

export default function Page() {
  return (
    <OffersPage />
  );
}
