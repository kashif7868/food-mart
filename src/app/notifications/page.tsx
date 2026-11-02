import type { Metadata } from "next";

import { NotificationsPage } from "@/features/account/AccountPages";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <NotificationsPage />
  );
}
