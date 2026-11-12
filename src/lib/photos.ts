import type { CuisineKey } from "@/components/brand/FoodArt";

/* Real food photographs (Unsplash License: free for commercial use, hotlinking allowed).
   For production, copy the ones you keep into /public/photos and change PHOTO_BASE,
   or upload your own through the dashboard. */
const U = "https://images.unsplash.com/";

const IDS: Record<CuisineKey, string[]> = {
  biryani: ["photo-1631515243349-e0cb75fb8d3a"],
  burger: ["photo-1757834787931-ddd70f3379a5", "photo-1630278156268-12d56c2e135f"],
  pizza: ["photo-1449785227466-10687c63e194", "photo-1517685645259-c6caddb7165d"],
  bbq: ["photo-1626323109697-df55d20f06a8", "photo-1626323109252-0adb3b46692b"],
  desi: ["photo-1772730065344-4cf131b39951", "photo-1768179669433-bd9d52949c20"],
  chinese: ["photo-1634864572865-1cf8ff8bd23d", "photo-1585032226651-759b368d7246", "photo-1733907557440-e8f8e179cd56"],
  dessert: ["photo-1666190092159-3171cf0fbb12"],
  drink: ["photo-1623065422902-30a2d299bbe4", "photo-1524059626752-fff2312fbfdc"],
};

export const photoUrl = (id: string, w = 640) => `${U}${id}?auto=format&fit=crop&w=${w}&q=75`;

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Deterministic real photo for a cuisine (same text always gets the same picture). */
export function cuisinePhoto(kind: CuisineKey, seed = "", w = 640): string {
  const list = IDS[kind] || IDS.desi;
  return photoUrl(list[hash(seed || kind) % list.length], w);
}
