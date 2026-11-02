import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import { SignupPage } from "@/features/auth/AuthPages";

export const metadata: Metadata = { title: "Sign Up" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupPage />
    </Suspense>
  );
}
