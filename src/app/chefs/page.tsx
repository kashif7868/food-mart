import type { Metadata } from "next";

import ProfilesListing from "@/features/discovery/ProfilesListing";

export const metadata: Metadata = { title: "Home Chefs" };

export default function Page() {
  return <ProfilesListing kind="chefs" />;
}
