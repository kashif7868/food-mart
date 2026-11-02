import type { Metadata } from "next";

import AwardsPage from "@/features/content/AwardsPage";

export const metadata: Metadata = { title: "FoodMart Awards" };

export default function Page() {
  return (
    <AwardsPage />
  );
}
