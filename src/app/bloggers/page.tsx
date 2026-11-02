import type { Metadata } from "next";

import ProfilesListing from "@/features/discovery/ProfilesListing";

export const metadata: Metadata = { title: "Food Bloggers" };

export default function Page() {
  return <ProfilesListing kind="bloggers" />;
}
