import type { Metadata } from "next";

import { FavouritesPage } from "@/features/account/AccountPages";

export const metadata: Metadata = { title: "Favourites" };

export default function Page() {
  return (
    <FavouritesPage />
  );
}
