"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LuAward, LuTrophy } from "react-icons/lu";

import { Avatar, EmptyState, PageHeading, Skeleton } from "@/components/ui";
import { discoveryApi } from "@/services/foodmart";
import { formatDate, profilePath, PROFILE_TYPE_LABEL } from "@/lib/utils";

/* FoodMart Awards - published winners (evidence-based, not paid) */
export default function AwardsPage() {
  const winners = useQuery({ queryKey: ["award-winners"], queryFn: () => discoveryApi.awards({ limit: 30 }) });
  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading eyebrow="Earned by verified orders & reviews" title="FoodMart Awards" subtitle="Winners are chosen from real order data, verified reviews and consistency - sponsored content never counts." />
      {winners.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : !winners.data?.items.length ? (
        <EmptyState icon={<LuAward />} title="No winners published yet" text="The first FoodMart Awards will be announced soon." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {winners.data.items.map((w: any) => (
            <Link key={w._id} href={w.profile ? profilePath(w.profile) : w.food?._id ? `/food/${w.food._id}` : "#"} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-warning-50 via-white to-brand-50 p-5 shadow-card ring-1 ring-warning-400/30 transition hover:-translate-y-0.5">
              <LuTrophy className="absolute -top-2 -right-2 text-8xl text-warning-400/20" />
              <p className="text-[11px] font-bold tracking-wider text-warning-600 uppercase">{w.category?.name || "Award"}</p>
              <p className="text-xs text-ink-500">{w.period?.title}</p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar src={w.profile?.avatar?.url} name={w.profile?.displayName || w.food?.name} size={52} />
                <div>
                  <p className="font-bold text-navy-900">
                    {w.rank === 1 ? "🥇" : w.rank === 2 ? "🥈" : "🥉"} {w.profile?.displayName || w.food?.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    {w.profile ? PROFILE_TYPE_LABEL[w.profile.profileType] : "Dish"} · {formatDate(w.publishedAt || w.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
