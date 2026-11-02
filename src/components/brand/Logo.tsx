"use client";

import Link from "next/link";
import { useId } from "react";

import { cn } from "@/lib/utils";

/* =========================================================
   OFFICIAL FOODMART LOGO (orange F + purple M) + wordmark
   Gradient ids are unique per instance so several logos can
   live on one page (header + footer + mobile drawer).
========================================================= */

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  const u = useId().replace(/:/g, "");
  return (
    <svg height={size} width={(size * 540) / 440} viewBox="290 175 540 440" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={`o-${u}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#FF8A00" />
          <stop offset="1" stopColor="#FF5E00" />
        </linearGradient>
        <linearGradient id={`om-${u}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF6A00" />
          <stop offset="1" stopColor="#FF8C00" />
        </linearGradient>
        <linearGradient id={`p-${u}`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#B01FC0" />
          <stop offset="0.55" stopColor="#7A12A8" />
          <stop offset="1" stopColor="#3E0C78" />
        </linearGradient>
      </defs>
      <path fill={`url(#o-${u})`} d="M310,265 Q310,195 380,195 L682,195 L577,300 L405,300 L405,525 Q405,595 335,595 L310,595 Z" />
      <path fill="#D94A00" opacity="0.35" d="M310,300 L405,300 L405,440 Z" />
      <path fill={`url(#om-${u})`} d="M405,370 L545,370 L490,445 L405,445 Z" />
      <path
        fill={`url(#p-${u})`}
        d="M545,370 L612,440 L742,302 Q764,282 788,285 Q808,290 808,318 L808,580 Q808,600 788,600 L742,600 Q722,600 722,580 L722,470 L642,548 Q612,572 582,545 L490,445 Z"
      />
      <path fill="#2A0656" opacity="0.28" d="M722,395 L808,318 L808,580 Q808,600 788,600 L742,600 Q722,600 722,580 Z" />
    </svg>
  );
}

export function Logo({ dark = false, size = 34, className, href = "/" }: { dark?: boolean; size?: number; className?: string; href?: string | null }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className={cn("font-extrabold tracking-tight", size >= 34 ? "text-[22px]" : "text-lg", dark ? "text-white" : "text-navy-900")}>
        food<span className="text-brand-500">mart</span>
      </span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="FoodMart home">
      {content}
    </Link>
  ) : (
    content
  );
}
