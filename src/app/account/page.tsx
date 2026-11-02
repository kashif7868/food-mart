import type { Metadata } from "next";

import { AccountPage } from "@/features/account/AccountPages";

export const metadata: Metadata = { title: "My Account" };

export default function Page() {
  return (
    <AccountPage />
  );
}
