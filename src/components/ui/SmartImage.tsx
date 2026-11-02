"use client";

import Image from "next/image";
import { useState } from "react";

import { CUISINE_BG, FoodArt, cuisineFor, type CuisineKey } from "@/components/brand/FoodArt";
import { cn } from "@/lib/utils";

/* =========================================================
   SMART IMAGE
   Shows the uploaded photo (backend media URL). When there is no
   photo, or it fails to load, a matching food illustration is shown
   instead, so cards always look complete.
   The parent decides the size: SmartImage fills it.
========================================================= */

export function SmartImage({
  src,
  alt,
  hint,
  kind,
  className,
  imgClassName,
  dark = false,
  priority = false,
  sizes = "(max-width: 768px) 50vw, 320px",
}: {
  src?: string | null;
  alt: string;
  hint?: string; // dish / cuisine text used to choose the illustration
  kind?: CuisineKey;
  className?: string;
  imgClassName?: string;
  dark?: boolean; // dark backdrop for reel cards
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const art = kind || cuisineFor(`${hint || ""} ${alt}`);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {showPhoto ? (
        <Image src={src as string} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", imgClassName)} onError={() => setFailed(true)} />
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-gradient-to-br", dark ? "from-[#3a1d10] via-[#24120b] to-[#140906]" : CUISINE_BG[art])}>
          <FoodArt kind={art} className={cn("max-h-[78%] max-w-[78%] drop-shadow-xl", dark && "max-h-[62%] max-w-[62%]")} />
        </div>
      )}
    </div>
  );
}
