import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import { LoginPage } from "@/features/auth/AuthPages";

export const metadata: Metadata = { title: "Sign In" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginPage />
    </Suspense>
  );
}
