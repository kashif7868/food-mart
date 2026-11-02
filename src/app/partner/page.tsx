import type { Metadata } from "next";

import { PartnerPage } from "@/features/auth/AuthPages";

export const metadata: Metadata = { title: "Partner With Us" };

export default function Page() {
  return (
    <PartnerPage />
  );
}
