import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import { VerifyEmailPage } from "@/features/auth/AuthPages";

export const metadata: Metadata = { title: "Verify Email" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmailPage />
    </Suspense>
  );
}
