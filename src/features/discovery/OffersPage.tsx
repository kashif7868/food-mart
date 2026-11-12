"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuClock, LuFlame, LuPlay, LuShoppingBag, LuTicketPercent } from "react-icons/lu";

import { dealLabel, DishCard, useDealOrder } from "@/components/cards/Cards";
import { Avatar, Button, EmptyState, ErrorState, PageHeading, SectionHeader, Skeleton, Tabs } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { getErrorMessage } from "@/services/api";
import { catalogApi, discoveryApi } from "@/services/foodmart";
import { cn, formatPKR, primaryImage, profilePath } from "@/lib/utils";
import { useLocationStore } from "@/store/locationStore";
import type { Deal, Food, Profile } from "@/lib/types";

/* =========================================================
   OFFERS - live deals from restaurants, chefs and food points
   Backend: GET /deals (city), GET /discover/trending
========================================================= */

const endsIn = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  return h >= 24 ? `${Math.floor(h / 24)}d left` : h >= 1 ? `${h}h left` : `${Math.max(1, Math.floor(ms / 60000))}m left`;
};

function DealCard({ deal, index }: { deal: Deal & { profile: Profile; foods: Food[] }; index: number }) {
  const food = deal.foods?.[0];
  const dealOrder = useDealOrder(deal);
  const [playing, setPlaying] = useState(false);
  const cover = deal.image?.url || deal.video?.thumbnailUrl || primaryImage(food?.media);
  const tone = index % 3 === 0 ? "grape-gradient" : index % 3 === 1 ? "brand-gradient" : "bg-gradient-to-br from-night-800 to-night-950";
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card transition hover:shadow-pop">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink-100">
        {playing && deal.video?.url ? (
          <video src={deal.video.url} poster={deal.video.thumbnailUrl} className="h-full w-full object-cover" controls autoPlay playsInline />
        ) : (
          <>
            <SmartImage src={cover} alt={food?.name || deal.title} hint={food?.name || deal.title} className="absolute inset-0 h-full w-full" />
            {deal.video?.url && (
              <button type="button" onClick={() => setPlaying(true)} aria-label="Play offer video" className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/35">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-brand-600 shadow-pop">
                  <LuPlay />
                </span>
              </button>
            )}
          </>
        )}
        <span className={cn("absolute top-3 left-3 rounded-full px-3 py-1 text-sm font-extrabold text-white shadow", tone)}>{dealLabel(deal)}</span>
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          <LuClock /> {endsIn(deal.endsAt)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-1 text-base font-bold text-navy-900">{deal.title}</p>
        {deal.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{deal.description}</p>}
        <Link href={profilePath(deal.profile)} className="mt-2 flex items-center gap-2">
          <Avatar src={deal.profile?.avatar?.url} name={deal.profile?.displayName} size={24} ring />
          <span className="truncate text-xs font-semibold text-ink-700">{deal.profile?.displayName}</span>
        </Link>
        <p className="mt-2 text-[11px] text-ink-500">
          {dealOrder.foods.length ? `On ${dealOrder.foods.map((f) => f.name).slice(0, 2).join(", ")}${dealOrder.foods.length > 2 ? ` +${dealOrder.foods.length - 2} more` : ""}` : "On the whole menu"}
          {deal.minOrderAmount ? ` · orders above ${formatPKR(deal.minOrderAmount)}` : ""}
        </p>
        <div className="mt-auto flex gap-2 pt-3">
          <Button className="flex-1" icon={<LuShoppingBag />} loading={dealOrder.busy} disabled={dealOrder.mine} onClick={dealOrder.order}>
            {dealOrder.label}
          </Button>
          <Link href={profilePath(deal.profile)} className="inline-flex items-center rounded-xl border border-ink-200 px-3 text-xs font-semibold text-ink-700 hover:bg-ink-50">
            Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const city = useLocationStore((s) => s.city);
  const [scope, setScope] = useState<"city" | "all">("city");
  const deals = useQuery({
    queryKey: ["offers", scope, city],
    // "In <city>" = only that city. "All Pakistan" = everything, nearest city first.
    queryFn: async () => {
      const list = await catalogApi.deals(scope === "city" ? { city, limit: 30 } : { preferCity: city, limit: 40 });
      if (scope === "city") return list;
      const mine = (d: (typeof list)[number]) => (d.profile?.address?.city || "").toLowerCase() === city.toLowerCase();
      return [...list].sort((a, b) => Number(mine(b)) - Number(mine(a)));
    },
  });
  const isLocal = (d: { profile?: Profile }) => (d.profile?.address?.city || "").toLowerCase() === city.toLowerCase();
  const nearby = scope === "all" ? (deals.data || []).filter(isLocal) : [];
  const others = scope === "all" ? (deals.data || []).filter((d) => !isLocal(d)) : [];
  const trending = useQuery({ queryKey: ["offers-trending"], queryFn: () => discoveryApi.trending({ limit: 10 }) });

  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading
        eyebrow="Deals applied automatically at checkout"
        title="Special Offers"
        subtitle="Live discounts from restaurants, home chefs and food points. No coupon codes needed."
        actions={<Tabs value={scope} onChange={setScope} tabs={[{ value: "city", label: `In ${city}` }, { value: "all", label: "All Pakistan" }]} />}
      />
      {deals.isError ? (
        <ErrorState message={getErrorMessage(deals.error)} onRetry={() => deals.refetch()} />
      ) : deals.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-ink-100 bg-white">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : !deals.data?.length ? (
        <EmptyState
          icon={<LuTicketPercent />}
          title={scope === "city" ? `No live offers in ${city} right now` : "No live offers right now"}
          text="Check back soon - partners add new deals every day."
          action={scope === "city" ? <Button variant="outline" onClick={() => setScope("all")}>See offers across Pakistan</Button> : undefined}
        />
      ) : scope === "city" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deals.data.map((d, i) => (
            <DealCard key={d._id} deal={d} index={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {nearby.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold text-navy-900">Near you · {city}</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {nearby.map((d, i) => (
                  <DealCard key={d._id} deal={d} index={i} />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold text-navy-900">{nearby.length ? "More across Pakistan" : `Nothing in ${city} yet - offers from other cities`}</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {others.map((d, i) => (
                  <DealCard key={d._id} deal={d} index={i + nearby.length} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <section className="mt-10">
        <SectionHeader icon={<LuFlame />} title="Popular right now" subtitle="Most ordered dishes this week" href="/explore" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {trending.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[230px] rounded-2xl" />)
            : (trending.data?.foods || []).map((f) => <DishCard key={f._id} food={f} compact />)}
        </div>
      </section>
    </div>
  );
}
