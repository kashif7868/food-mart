"use client";

import { useId, type ReactElement } from "react";

import { cn } from "@/lib/utils";

/* =========================================================
   FOOD ILLUSTRATIONS (vector, no stock photos needed)
   Used as the fallback whenever a restaurant has not uploaded a
   photo yet, and for the cuisine circles. Real uploads replace
   them automatically (see SmartImage).
========================================================= */

export type CuisineKey = "biryani" | "burger" | "pizza" | "bbq" | "desi" | "chinese" | "dessert" | "drink";

/* Pick an illustration from a dish / cuisine name */
export const cuisineFor = (text = ""): CuisineKey => {
  const t = text.toLowerCase();
  if (/biryani|pulao|rice/.test(t)) return "biryani";
  if (/pizza/.test(t)) return "pizza";
  if (/bbq|tikka|kabab|kebab|grill|boti|seekh|steak|wings/.test(t)) return "bbq";
  if (/karahi|nihari|haleem|handi|daal|desi|qorma|korma|curry|paratha|puri|halwa/.test(t)) return "desi";
  if (/chinese|noodle|chow|wok|ramen|manchurian|soup/.test(t)) return "chinese";
  if (/dessert|cake|ice|kheer|mithai|sweet|brownie|kulfi|mango|firni|gulab/.test(t)) return "dessert";
  if (/drink|chai|tea|coffee|lassi|juice|shake|soda|mojito|beverage/.test(t)) return "drink";
  return "burger";
};

const Plate = ({ id }: { id: string }) => (
  <>
    <defs>
      <radialGradient id={`plate-${id}`} cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="80%" stopColor="#f3eee8" />
        <stop offset="100%" stopColor="#d9cfc4" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="52" r="40" fill="#000" opacity="0.12" />
    <circle cx="50" cy="50" r="40" fill={`url(#plate-${id})`} />
    <circle cx="50" cy="50" r="31" fill="#efe7de" />
  </>
);

function Biryani({ id }: { id: string }) {
  const grains = Array.from({ length: 26 }, (_, i) => ({ x: 30 + ((i * 37) % 40), y: 34 + ((i * 23) % 30), r: (i * 47) % 180 }));
  return (
    <>
      <Plate id={id} />
      <ellipse cx="50" cy="50" rx="27" ry="24" fill="#f6dfa3" />
      <ellipse cx="44" cy="44" rx="13" ry="9" fill="#f7a933" opacity="0.85" />
      <ellipse cx="58" cy="58" rx="11" ry="7" fill="#ef7f1a" opacity="0.6" />
      {grains.map((g, i) => (
        <ellipse key={i} cx={g.x} cy={g.y} rx="2.2" ry="0.9" fill="#fff8e6" transform={`rotate(${g.r} ${g.x} ${g.y})`} />
      ))}
      <path d="M52 40c6-5 15-3 17 4s-4 12-11 11c-4 0-7-3-9-6l-6 4-3-4 6-4c-1-2 2-4 6-5z" fill="#a8521f" />
      <path d="M56 42c4-2 9-1 10 3" stroke="#d4843f" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="39" cy="54" r="5" fill="#8f3f14" />
      <path d="M33 38l4-4 2 5z M62 62l5 1-3 4z M36 62l-2 5 5-1z" fill="#3aa357" />
      <circle cx="66" cy="38" r="5" fill="#f4e26b" stroke="#e1c43a" strokeWidth="1" />
    </>
  );
}

function Burger({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`bun-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6b25a" />
          <stop offset="100%" stopColor="#c76a1f" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="84" rx="34" ry="6" fill="#000" opacity="0.15" />
      <path d="M17 66h66c0 8-6 14-14 14H31c-8 0-14-6-14-14z" fill="#d98a3a" />
      <rect x="15" y="56" width="70" height="11" rx="5.5" fill="#5b2a14" />
      <path d="M16 55l8 7 8-7 9 7 9-7 9 7 9-7 8 7 8-7v-3H16z" fill="#ffc83d" />
      <path d="M14 50c4 4 8-2 12 2s8-2 12 2 8-2 12 2 8-2 12 2 8-2 12 2 8-3 0-8H14z" fill="#4caf50" />
      <path d="M15 47c0-18 16-28 35-28s35 10 35 28c0 3-2 4-5 4H20c-3 0-5-1-5-4z" fill={`url(#bun-${id})`} />
      {[
        [34, 32],
        [46, 27],
        [58, 30],
        [66, 38],
        [40, 40],
        [54, 38],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="2.4" ry="1.3" fill="#fff4dc" transform={`rotate(${i * 25} ${x} ${y})`} />
      ))}
      <path d="M28 30c6-6 14-8 20-8" stroke="#ffd79a" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
    </>
  );
}

function Pizza({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`crust-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#e9a64f" />
          <stop offset="100%" stopColor="#b8691f" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="53" r="40" fill="#000" opacity="0.12" />
      <circle cx="50" cy="50" r="40" fill={`url(#crust-${id})`} />
      <circle cx="50" cy="50" r="33" fill="#d9402b" />
      <path d="M22 46c6-8 14-2 20-8s14 0 20-4 12 4 16 10-2 16 2 20-10 10-18 8-12 6-20 2-14-2-18-10 0-10-2-18z" fill="#ffd25e" />
      {[
        [38, 38],
        [60, 36],
        [42, 60],
        [64, 58],
        [52, 48],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="#b3261e" />
          <circle cx={x - 1.5} cy={y - 1.5} r="1.6" fill="#e2574c" />
        </g>
      ))}
      {[
        [30, 52],
        [70, 46],
        [50, 68],
        [48, 30],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y}c3-4 7-3 6 1-3 3-6 2-6-1z`} fill="#2f9e44" />
      ))}
      <path d="M50 10v80M10 50h80M22 22l56 56M78 22L22 78" stroke="#b8691f" strokeWidth="0.8" opacity="0.35" />
    </>
  );
}

function Bbq({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`grill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2a26" />
          <stop offset="1" stopColor="#1f1513" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill={`url(#grill-${id})`} />
      {[30, 40, 50, 60, 70].map((y) => (
        <path key={y} d={`M18 ${y}h64`} stroke="#5b4741" strokeWidth="2" />
      ))}
      {[0, 1].map((k) => (
        <g key={k} transform={`rotate(-30 50 50) translate(0 ${k * 18 - 9})`}>
          <rect x="10" y="49" width="80" height="2" rx="1" fill="#d7b98c" />
          {[24, 38, 52, 66].map((x, i) => (
            <rect key={x} x={x - 6} y="43" width="12" height="13" rx="4" fill={i % 2 ? "#e0643a" : "#9b3b1b"} />
          ))}
          <rect x="31" y="45" width="3" height="9" rx="1.5" fill="#6ab04c" />
          <rect x="59" y="45" width="3" height="9" rx="1.5" fill="#f2e7c9" />
        </g>
      ))}
      <path d="M30 22c-3-5 2-8 0-12M50 18c-3-5 2-8 0-12M70 22c-3-5 2-8 0-12" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

function Desi({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`curry-${id}`} cx="45%" cy="40%" r="60%">
          <stop offset="0" stopColor="#f59a3b" />
          <stop offset="1" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="58" rx="44" ry="12" fill="#000" opacity="0.12" />
      <rect x="2" y="44" width="14" height="6" rx="3" fill="#2a2a2a" />
      <rect x="84" y="44" width="14" height="6" rx="3" fill="#2a2a2a" />
      <ellipse cx="50" cy="50" rx="38" ry="34" fill="#2b2b2b" />
      <ellipse cx="50" cy="48" rx="32" ry="28" fill={`url(#curry-${id})`} />
      <path d="M34 42c5-6 12-6 16 0s12 6 16 0" stroke="#fff3e0" strokeWidth="3" fill="none" strokeLinecap="round" />
      {[
        [40, 54],
        [58, 56],
        [50, 40],
        [64, 44],
        [36, 44],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="5" ry="4" fill="#8a2c0d" />
      ))}
      <path d="M44 62c6 2 12 2 18-1" stroke="#2f9e44" strokeWidth="3" strokeLinecap="round" fill="none" />
      {[
        [32, 50],
        [56, 34],
        [66, 58],
        [46, 48],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#37b24d" />
      ))}
    </>
  );
}

function Chinese({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`bowl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e03131" />
          <stop offset="1" stopColor="#a61e1e" />
        </linearGradient>
      </defs>
      <rect x="56" y="6" width="4" height="52" rx="2" fill="#c9a26b" transform="rotate(20 58 32)" />
      <rect x="66" y="8" width="4" height="52" rx="2" fill="#b38b57" transform="rotate(28 68 34)" />
      <ellipse cx="50" cy="46" rx="38" ry="12" fill="#fff4dc" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${18 + i * 7} 42c3 4 3 8 0 12`} stroke="#f2c14e" strokeWidth="3" fill="none" strokeLinecap="round" />
      ))}
      <ellipse cx="38" cy="42" rx="7" ry="5" fill="#fff" />
      <circle cx="38" cy="42" r="3" fill="#ffb703" />
      {[
        [56, 40],
        [62, 46],
        [48, 48],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#2f9e44" />
      ))}
      <path d="M12 46h76c-2 22-18 36-38 36S14 68 12 46z" fill={`url(#bowl-${id})`} />
      <path d="M26 62c8 6 40 6 48 0" stroke="#ffd43b" strokeWidth="2" fill="none" opacity="0.8" />
      <ellipse cx="50" cy="88" rx="16" ry="3" fill="#000" opacity="0.15" />
    </>
  );
}

function Dessert({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="22" ry="4" fill="#000" opacity="0.15" />
      <path d="M26 34h48l-6 50c-1 4-4 6-8 6H40c-4 0-7-2-8-6z" fill="#ffe3ec" />
      <path d="M28 50h44l-1 10H29z" fill="#f06595" />
      <path d="M30 70h40l-1 8H31z" fill="#fff0f6" />
      <path d="M29 62h42l-1 8H30z" fill="#e64980" opacity="0.8" />
      <path d="M26 34h48l-6 50c-1 4-4 6-8 6H40c-4 0-7-2-8-6z" fill={`url(#glass-${id})`} />
      <path d="M24 34c4-10 14-12 26-12s22 2 26 12z" fill="#fff9f0" />
      <path d="M44 22c-2-8 6-14 12-10 5 3 4 10-2 12-4 1-8 1-10-2z" fill="#e03131" />
      <path d="M50 12l-3-5 6 2z" fill="#2f9e44" />
      {[
        [46, 16],
        [52, 19],
        [49, 22],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.8" fill="#ffd43b" />
      ))}
    </>
  );
}

function Drink({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`juice-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b197fc" />
          <stop offset="1" stopColor="#6741d9" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="92" rx="18" ry="3.5" fill="#000" opacity="0.15" />
      <rect x="54" y="4" width="4" height="40" rx="2" fill="#ff6b1a" transform="rotate(14 56 24)" />
      <path d="M30 26h40l-4 60c0 3-3 6-6 6H40c-3 0-6-3-6-6z" fill={`url(#juice-${id})`} />
      <rect x="38" y="36" width="10" height="10" rx="2" fill="#fff" opacity="0.55" transform="rotate(12 43 41)" />
      <rect x="51" y="44" width="10" height="10" rx="2" fill="#fff" opacity="0.45" transform="rotate(-10 56 49)" />
      <rect x="42" y="56" width="9" height="9" rx="2" fill="#fff" opacity="0.4" />
      <path d="M30 26h40l-1 6H31z" fill="#ffffff" opacity="0.35" />
      <circle cx="68" cy="26" r="9" fill="#ffe066" stroke="#fab005" strokeWidth="2" />
      <path d="M68 18v16M60 26h16M62 20l12 12M74 20L62 32" stroke="#fab005" strokeWidth="0.8" />
      <path d="M36 30v50" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
    </>
  );
}

const ART: Record<CuisineKey, (p: { id: string }) => ReactElement> = {
  biryani: Biryani,
  burger: Burger,
  pizza: Pizza,
  bbq: Bbq,
  desi: Desi,
  chinese: Chinese,
  dessert: Dessert,
  drink: Drink,
};

/* Background tint behind each illustration (warm, like the photos in the design) */
export const CUISINE_BG: Record<CuisineKey, string> = {
  biryani: "from-amber-100 to-orange-200",
  burger: "from-orange-100 to-amber-200",
  pizza: "from-rose-100 to-orange-100",
  bbq: "from-stone-300 to-stone-500",
  desi: "from-orange-100 to-red-200",
  chinese: "from-red-100 to-amber-100",
  dessert: "from-pink-100 to-rose-200",
  drink: "from-violet-100 to-purple-200",
};

export function FoodArt({ kind, className }: { kind: CuisineKey; className?: string }) {
  const id = useId().replace(/:/g, "");
  const Art = ART[kind] || Burger;
  return (
    <svg viewBox="0 0 100 100" className={cn("h-full w-full", className)} aria-hidden>
      <Art id={id} />
    </svg>
  );
}

/* Big hero illustration: biryani bowl on orange & purple blobs (matches the design composition) */
export function HeroArt({ className }: { className?: string }) {
  const u = useId().replace(/:/g, "");
  const grains = Array.from({ length: 90 }, (_, i) => ({
    x: 120 + ((i * 53) % 170),
    y: 120 + ((i * 29) % 78),
    r: (i * 37) % 180,
  }));
  return (
    <svg viewBox="0 0 420 340" className={className} aria-hidden>
      <defs>
        <linearGradient id={`blobP-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id={`blobO-${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb36b" />
          <stop offset="1" stopColor="#ff6b1a" />
        </linearGradient>
        <radialGradient id={`rice-${u}`} cx="45%" cy="35%" r="65%">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.55" stopColor="#f7c35a" />
          <stop offset="1" stopColor="#e07b17" />
        </radialGradient>
        <linearGradient id={`bowl-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a22" />
          <stop offset="1" stopColor="#140c09" />
        </linearGradient>
      </defs>
      <path d="M300 40c60 10 110 60 110 130s-40 140-110 150-120-40-120-110 60-180 120-170z" fill={`url(#blobP-${u})`} opacity="0.9" />
      <path d="M60 80c50-40 160-50 220 0s40 150-40 190S40 260 30 200s-10-90 30-120z" fill={`url(#blobO-${u})`} opacity="0.85" />
      <ellipse cx="205" cy="268" rx="165" ry="26" fill="#000" opacity="0.22" />
      <ellipse cx="205" cy="190" rx="160" ry="78" fill={`url(#bowl-${u})`} />
      <ellipse cx="205" cy="176" rx="146" ry="64" fill="#2a1d17" />
      <path d="M70 172c10-60 80-92 135-92s125 30 135 92c-30 30-90 44-135 44S98 202 70 172z" fill={`url(#rice-${u})`} />
      {grains.map((g, i) => (
        <ellipse key={i} cx={g.x} cy={g.y} rx="5" ry="1.8" fill={i % 3 ? "#fff8e1" : "#ffd27a"} transform={`rotate(${g.r} ${g.x} ${g.y})`} />
      ))}
      <g transform="translate(205 120) rotate(-18)">
        <path d="M-10 -26c26-12 56-4 60 18s-12 34-34 32c-12-1-20-8-24-16l-20 10-8-12 20-10c-4-8 0-18 6-22z" fill="#a14a1a" />
        <path d="M2 -20c14-6 32-2 36 10" stroke="#d98a44" strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="-44" y="-2" width="22" height="9" rx="4.5" fill="#f3e3c3" transform="rotate(-26 -33 2)" />
      </g>
      <path d="M118 150c20-16 40-10 48 6s-6 30-24 28-30-18-24-34z" fill="#8e3b14" />
      <path d="M262 148c18-10 40-2 42 16s-14 26-30 22-24-24-12-38z" fill="#9d4317" />
      <circle cx="300" cy="120" r="14" fill="#ffe066" stroke="#f2c230" strokeWidth="3" />
      <path d="M150 118l10-10 4 13zM250 104l14 2-8 10zM180 190l-6 12 12-3zM290 176l12 4-9 8z" fill="#2f9e44" />
      <path d="M160 70c-8-14 6-22 0-36M205 62c-8-14 6-22 0-36M250 70c-8-14 6-22 0-36" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
