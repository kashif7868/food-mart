import type { Metadata } from "next";

import ProfilesListing from "@/features/discovery/ProfilesListing";

export const metadata: Metadata = { title: "Food Points" };

export default function Page() {
  return <ProfilesListing kind="food-points" />;
}
