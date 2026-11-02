"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuBadgeCheck, LuCrosshair, LuSearch, LuUsers } from "react-icons/lu";

import { PlaceCard } from "@/components/cards/Cards";
import { Avatar, Button, EmptyState, ErrorState, PageHeading, Skeleton, Tabs } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { getErrorMessage } from "@/services/api";
import { discoveryApi } from "@/services/foodmart";
import { cn, cuisineLine, formatCompact, profilePath } from "@/lib/utils";
import { locationParams, useLocationStore } from "@/store/locationStore";
import type { ListingKind, Profile } from "@/lib/types";

/* =========================================================
   LISTINGS: Restaurants · Chefs · Food Points · Bloggers
   Backend: GET /profiles (type, city, q, sort, verified, page)
            GET /discovery/nearby?type=sellers (Food Points "Near me")
========================================================= */

const KIND: Record<ListingKind, { type: string; title: string; subtitle: string; eyebrow: string }> = {
  restaurants: { type: "RESTAURANT", title: "Restaurants", subtitle: "From family favourites to new hotspots - rated by verified orders.", eyebrow: "Dine in · Takeaway · Delivery" },
  chefs: { type: "CHEF", title: "Home Chefs", subtitle: "Home-cooked meals and specialities from talented chefs near you.", eyebrow: "Made with love at home" },
  "food-points": { type: "LOCAL_POINT", title: "Food Points", subtitle: "Dhabas, stalls, carts and hidden street-food gems.", eyebrow: "Street food · Local flavours" },
  bloggers: { type: "BLOGGER", title: "Food Bloggers", subtitle: "Honest reviews, reels and food trails from Pakistan's food creators.", eyebrow: "Reviews · Reels · Food trails" },
};

const CUISINE_FILTERS = ["biryani", "burgers", "pizza", "bbq", "desi", "chinese", "desserts", "street food"];

function CreatorTile({ profile }: { profile: Profile }) {
  return (
    <Link href={profilePath(profile)} className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative h-24">
        <SmartImage src={profile.cover?.url} alt={profile.displayName} hint={(profile.cuisines || []).join(" ")} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="relative z-10 -mt-9 flex flex-col items-center px-3 pb-4 text-center">
        <span className="rounded-full bg-gradient-to-br from-brand-400 to-grape-600 p-[3px]">
          <Avatar src={profile.avatar?.url} name={profile.displayName} size={64} ring />
        </span>
        <p className="mt-2 flex items-center gap-1 text-sm font-bold text-navy-900">
          {profile.displayName}
          {profile.verificationStatus === "VERIFIED" && <LuBadgeCheck className="text-grape-600" />}
        </p>
        <p className="text-xs text-ink-500">{cuisineLine(profile.cuisines || profile.specialties) || profile.address?.city || "Food creator"}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-600">
          <span>
            <b className="text-navy-900">{formatCompact(profile.stats?.followers)}</b> followers
          </span>
          <span>
            <b className="text-navy-900">{formatCompact(profile.stats?.posts)}</b> posts
          </span>
        </div>
        {profile.collaborationStatus === "OPEN" && <span className="mt-2 rounded-full bg-success-50 px-2.5 py-0.5 text-[10px] font-semibold text-success-600">Open to collaborations</span>}
      </div>
    </Link>
  );
}

export default function ProfilesListing({ kind }: { kind: ListingKind }) {
  const cfg = KIND[kind];
  const { city, coords, locate } = useLocationStore();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"rating" | "followers" | "newest">(kind === "bloggers" ? "followers" : "rating");
  const [scope, setScope] = useState<"city" | "all" | "near">("city");
  const [cuisine, setCuisine] = useState("");
  const [verified, setVerified] = useState(false);

  const near = scope === "near" && kind !== "bloggers";
  const list = useInfiniteQuery({
    queryKey: ["listing", kind, query, sort, scope, cuisine, verified, city, coords],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      if (near) {
        const r = await discoveryApi.nearby({ type: "sellers", sellerType: cfg.type, radiusKm: 15, limit: 40, cuisine: cuisine || undefined, verified: verified || undefined, ...locationParams({ city, coords }) });
        return { items: r.items as (Profile & { distanceKm?: number })[], meta: { page: 1, totalPages: 1 } };
      }
      const r = await discoveryApi.profiles({
        type: cfg.type,
        q: query || undefined,
        city: scope === "city" ? city : undefined,
        sort: sort === "newest" ? undefined : sort,
        cuisine: cuisine || undefined,
        verified: verified || undefined,
        page: pageParam,
        limit: 12,
      });
      return { items: r.items as (Profile & { distanceKm?: number })[], meta: r.meta };
    },
    getNextPageParam: (last) => (last.meta && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
  const items = list.data?.pages.flatMap((p) => p.items) || [];

  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading eyebrow={cfg.eyebrow} title={cfg.title} subtitle={cfg.subtitle} />

      <div className="card mb-6 space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(q.trim());
            }}
            className="relative flex-1"
          >
            <LuSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cfg.title.toLowerCase()} by name`} className="field rounded-full pl-10" />
          </form>
          <Tabs
            value={scope}
            onChange={async (v) => {
              if (v === "near" && !coords) await locate();
              setScope(v);
            }}
            tabs={[
              { value: "city", label: `In ${city}` },
              { value: "all", label: "All Pakistan" },
              ...(kind !== "bloggers" ? [{ value: "near" as const, label: "Near me" }] : []),
            ]}
          />
          {!near && (
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field w-full rounded-full lg:w-44" aria-label="Sort">
              <option value="rating">Top rated</option>
              <option value="followers">Most followed</option>
              <option value="newest">Newest</option>
            </select>
          )}
        </div>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setVerified((v) => !v)} className={cn("flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold", verified ? "border-grape-600 bg-grape-50 text-grape-700" : "border-ink-200 text-ink-600")}>
            <LuBadgeCheck /> Verified only
          </button>
          {kind !== "bloggers" &&
            CUISINE_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine((x) => (x === c ? "" : c))}
                className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize", cuisine === c ? "border-brand-500 bg-brand-500 text-white" : "border-ink-200 text-ink-600 hover:border-brand-300")}
              >
                {c}
              </button>
            ))}
        </div>
      </div>

      {near && !coords && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-xs text-brand-700">
          <LuCrosshair /> Showing places around {city}. Allow location access for results around you.
        </p>
      )}

      {list.isError ? (
        <ErrorState message={getErrorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState icon={<LuUsers />} title={`No ${cfg.title.toLowerCase()} found`} text={scope === "city" ? `Try "All Pakistan" or another city.` : "Try different filters."} />
      ) : (
        <div className={cn("grid gap-3 sm:gap-4", kind === "bloggers" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4")}>
          {items.map((p) => (kind === "bloggers" ? <CreatorTile key={p._id} profile={p} /> : <PlaceCard key={p._id} profile={p} distanceKm={p.distanceKm} />))}
        </div>
      )}
      {list.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
