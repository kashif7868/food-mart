import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import ReelsPage from "@/features/reels/ReelsPage";

export const metadata: Metadata = { title: "Reels" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ReelsPage />
    </Suspense>
  );
}
