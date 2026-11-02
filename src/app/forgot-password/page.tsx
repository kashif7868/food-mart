import type { Metadata } from "next";

import { ForgotPasswordPage } from "@/features/auth/AuthPages";

export const metadata: Metadata = { title: "Forgot Password" };

export default function Page() {
  return (
    <ForgotPasswordPage />
  );
}
