import type { Metadata } from "next";

import StaticPage from "@/features/content/StaticPage";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function Page() {
  return <StaticPage slug="cookies" />;
}
