"use client";

import { useState } from "react";
import { LuUtensilsCrossed } from "react-icons/lu";

import type { CuisineKey } from "@/components/brand/FoodArt";
import { cuisinePhoto } from "@/lib/photos";
import { cn } from "@/lib/utils";

/* Real photo for a cuisine. If the network image fails, a soft gradient with an icon is shown. */
export function FoodPhoto({ kind, seed, alt = "", w = 640, className }: { kind: CuisineKey; seed?: string; alt?: string; w?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400", className)}>
        <LuUtensilsCrossed className="text-[28px]" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cuisinePhoto(kind, seed, w)} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={cn("object-cover", className)} />
  );
}
