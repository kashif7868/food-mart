import type { Metadata } from "next";

import StaticPage from "@/features/content/StaticPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Page() {
  return <StaticPage slug="terms" />;
}
