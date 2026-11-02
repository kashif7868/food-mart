import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import ExplorePage from "@/features/discovery/ExplorePage";

export const metadata: Metadata = { title: "Explore" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ExplorePage />
    </Suspense>
  );
}
