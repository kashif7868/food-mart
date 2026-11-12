"use client";

import Image from "next/image";
import { useState } from "react";

import { cuisineFor, type CuisineKey } from "@/components/brand/FoodArt";
import { FoodPhoto } from "@/components/ui/FoodPhoto";
import { cn } from "@/lib/utils";

/* =========================================================
   SMART IMAGE
   Shows the uploaded photo (backend media URL). When there is no
   photo, or it fails to load, a matching real food photo is shown
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
  priority = false,
  sizes = "(max-width: 768px) 50vw, 320px",
}: {
  src?: string | null;
  alt: string;
  hint?: string; // dish / cuisine text used to choose the illustration
  kind?: CuisineKey;
  className?: string;
  imgClassName?: string;
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
        <FoodPhoto kind={art} seed={`${hint || ""}${alt}`} alt={alt} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
