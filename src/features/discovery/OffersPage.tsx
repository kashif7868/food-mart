"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuClock, LuFlame, LuTicketPercent } from "react-icons/lu";

import { dealLabel, DishCard } from "@/components/cards/Cards";
import { Avatar, EmptyState, ErrorState, PageHeading, SectionHeader, Skeleton, Tabs } from "@/components/ui";
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
  return (
    <Link
      href={food?._id ? `/food/${food._id}` : profilePath(deal.profile)}
      className={cn("group relative flex min-h-[170px] overflow-hidden rounded-3xl p-5 text-white shadow-pop transition hover:-translate-y-0.5", index % 3 === 0 ? "grape-gradient" : index % 3 === 1 ? "brand-gradient" : "bg-gradient-to-br from-night-800 to-night-950")}
    >
      <div className="relative z-10 flex max-w-[58%] flex-col">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
          <LuClock /> {endsIn(deal.endsAt)}
        </span>
        <p className="mt-2 text-2xl leading-tight font-extrabold">{dealLabel(deal)}</p>
        <p className="mt-1 line-clamp-2 text-sm text-white/90">{deal.title}</p>
        {deal.minOrderAmount ? <p className="mt-1 text-[11px] text-white/75">On orders above {formatPKR(deal.minOrderAmount)}</p> : null}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <Avatar src={deal.profile?.avatar?.url} name={deal.profile?.displayName} size={26} ring />
          <span className="truncate text-xs font-semibold">{deal.profile?.displayName}</span>
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 h-44 w-44 rounded-full bg-white/10" />
      <SmartImage src={primaryImage(food?.media)} alt={food?.name || deal.title} hint={food?.name || deal.profile?.cuisines?.join(" ")} className="absolute right-4 bottom-4 h-28 w-28 rounded-2xl shadow-pop transition group-hover:scale-105 sm:h-32 sm:w-32" />
    </Link>
  );
}

export default function OffersPage() {
  const city = useLocationStore((s) => s.city);
  const [scope, setScope] = useState<"city" | "all">("city");
  const deals = useQuery({ queryKey: ["offers", scope, city], queryFn: () => catalogApi.deals({ city: scope === "city" ? city : undefined, limit: 30 }) });
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
            <Skeleton key={i} className="h-[170px] rounded-3xl" />
          ))}
        </div>
      ) : !deals.data?.length ? (
        <EmptyState icon={<LuTicketPercent />} title={`No live offers ${scope === "city" ? `in ${city}` : ""} right now`} text="Check back soon - partners add new deals every day." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deals.data.map((d, i) => (
            <DealCard key={d._id} deal={d} index={i} />
          ))}
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
