import { Suspense } from "react";
import type { Metadata } from "next";

import Loading from "../loading";
import { ResetPasswordPage } from "@/features/auth/AuthPages";

export const metadata: Metadata = { title: "Reset Password" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
