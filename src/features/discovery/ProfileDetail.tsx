"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LuBadgeCheck,
  LuBike,
  LuClock,
  LuFacebook,
  LuGlobe,
  LuInstagram,
  LuMapPin,
  LuPhone,
  LuShare2,
  LuShoppingBag,
  LuStore,
  LuUsers,
} from "react-icons/lu";

import { DishCard, OfferBanner, ReelCard } from "@/components/cards/Cards";
import { Avatar, Badge, Button, EmptyState, ErrorState, PageLoader, Rating, Skeleton, Stars, Tabs } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { useFollow } from "@/hooks/useSocial";
import { useIsMine } from "@/hooks/useOwnership";
import { DASHBOARD_URL } from "@/lib/config";
import { getErrorMessage } from "@/services/api";
import { catalogApi, discoveryApi, reviewApi, socialApi } from "@/services/foodmart";
import { cuisineLine, formatCompact, formatPKR, primaryImage, profileRating, PROFILE_TYPE_LABEL, timeAgo, titleCase } from "@/lib/utils";
import type { Profile, Review } from "@/lib/types";

/* =========================================================
   PUBLIC PROFILE (restaurant / home chef / food point / blogger)
   Backend: GET /profiles/:idOrSlug, /profiles/:id/foods,
   /profiles/:id/posts, /profiles/:id/reviews, /profiles/:id/deals
========================================================= */

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function ReviewList({ reviews, loading }: { reviews?: Review[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-40" />;
  if (!reviews?.length) return <EmptyState title="No reviews yet" text="Reviews come from verified orders only." />;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r._id} className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar name={r.user?.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy-900">{r.user?.name || "FoodMart user"}</p>
              <div className="flex items-center gap-2 text-[11px] text-ink-500">
                <Stars value={r.rating} size="text-xs" /> {timeAgo(r.createdAt)}
                {r.isVerifiedPurchase !== false && <Badge tone="green">Verified order</Badge>}
              </div>
            </div>
          </div>
          {r.text && <p className="mt-2 text-sm text-ink-700">{r.text}</p>}
          {r.sellerReply?.text && (
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
              <b className="text-ink-800">Reply from the owner:</b> {r.sellerReply.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RatingSummary({ distribution, average, count }: { distribution?: Record<string, number>; average: number; count: number }) {
  const total = Math.max(1, Object.values(distribution || {}).reduce((a, b) => a + b, 0));
  return (
    <div className="card flex gap-5 p-4">
      <div className="text-center">
        <p className="text-4xl font-extrabold text-navy-900">{average ? average.toFixed(1) : "-"}</p>
        <Stars value={average} />
        <p className="mt-1 text-xs text-ink-500">{formatCompact(count)} reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-ink-500">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div className="brand-gradient h-full rounded-full" style={{ width: `${((distribution?.[n] || 0) / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Tab = "menu" | "posts" | "reviews" | "about";

export default function ProfileDetail({ idOrSlug }: { idOrSlug: string }) {
  const profileQ = useQuery({ queryKey: ["profile", idOrSlug], queryFn: () => discoveryApi.profile(idOrSlug) });
  const p = profileQ.data;
  if (profileQ.isLoading) return <PageLoader />;
  if (profileQ.isError || !p) return <div className="container-fm py-10"><ErrorState message={getErrorMessage(profileQ.error, "Profile not found.")} onRetry={() => profileQ.refetch()} /></div>;
  return <ProfileView profile={p} />;
}

function ProfileView({ profile: p }: { profile: Profile & { viewer?: { isFollowing: boolean } } }) {
  const isBlogger = p.profileType === "BLOGGER";
  const [tab, setTab] = useState<Tab>(isBlogger ? "posts" : "menu");
  const follow = useFollow(p._id, Boolean(p.viewer?.isFollowing));
  const mine = useIsMine(p._id);
  const foods = useQuery({ queryKey: ["profile-foods", p._id], queryFn: () => catalogApi.profileFoods(p._id), enabled: !isBlogger });
  const deals = useQuery({ queryKey: ["profile-deals", p._id], queryFn: () => catalogApi.profileDeals(p._id), enabled: !isBlogger });
  const posts = useQuery({ queryKey: ["profile-posts", p._id], queryFn: () => socialApi.profilePosts(p._id, { limit: 24 }), enabled: tab === "posts" });
  const reviews = useQuery({ queryKey: ["profile-reviews", p._id], queryFn: () => reviewApi.profileReviews(p._id, { limit: 20 }), enabled: tab === "reviews" && !isBlogger });
  const rating = profileRating(p);
  const followers = (p.stats?.followers || 0) + (follow.on && !p.viewer?.isFollowing ? 1 : follow.on || !p.viewer?.isFollowing ? 0 : -1);

  const categories = useMemo(() => {
    const groups: Record<string, typeof foods.data> = {};
    (foods.data || []).forEach((f) => {
      const key = typeof f.category === "object" ? f.category.name : "Menu";
      (groups[key] = groups[key] || []).push(f);
    });
    return Object.entries(groups);
  }, [foods.data]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: p.displayName, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const settings = p.sellerSettings;
  const tabs = isBlogger
    ? [
        { value: "posts" as Tab, label: "Posts & Reels", count: p.stats?.posts },
        { value: "about" as Tab, label: "About" },
      ]
    : [
        { value: "menu" as Tab, label: "Menu", count: foods.data?.length },
        { value: "posts" as Tab, label: "Reels & Posts" },
        { value: "reviews" as Tab, label: "Reviews", count: rating.count },
        { value: "about" as Tab, label: "About" },
      ];

  return (
    <div className="pb-10">
      {/* cover */}
      <div className="relative h-44 sm:h-60 lg:h-72">
        <SmartImage src={p.cover?.url} alt={p.displayName} hint={(p.cuisines || []).join(" ")} className="absolute inset-0" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      </div>
      <div className="container-fm">
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
          <span className="relative -mt-14 w-fit shrink-0 rounded-full bg-white p-1 shadow-pop sm:-mt-16">
            <Avatar src={p.avatar?.url} name={p.displayName} size={112} />
          </span>
          <div className="min-w-0 flex-1 md:pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{p.displayName}</h1>
              {p.verificationStatus === "VERIFIED" && (
                <Badge tone="purple">
                  <LuBadgeCheck /> Verified
                </Badge>
              )}
              <Badge tone="orange">{PROFILE_TYPE_LABEL[p.profileType]}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
              {!isBlogger && <Rating value={rating.average} count={rating.count} className="text-sm" />}
              <span className="flex items-center gap-1">
                <LuUsers /> {formatCompact(Math.max(0, followers))} followers
              </span>
              {p.address?.city && (
                <span className="flex items-center gap-1">
                  <LuMapPin /> {[p.address.area, p.address.city].filter(Boolean).join(", ")}
                </span>
              )}
              {cuisineLine(p.cuisines, 3) && <span>{cuisineLine(p.cuisines, 3)}</span>}
            </div>
          </div>
          <div className="flex gap-2 md:pt-4">
            {mine ? (
              <a href={DASHBOARD_URL} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-600">
                Manage in dashboard
              </a>
            ) : (
              <Button variant={follow.on ? "outline" : "primary"} onClick={follow.toggle} loading={follow.busy}>
                {follow.on ? "Following" : "Follow"}
              </Button>
            )}
            <Button variant="outline" icon={<LuShare2 />} onClick={share} aria-label="Share">
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        {p.awards?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {p.awards.map((a) => (
              <span key={a.badgeCode + a.awardedAt} className="rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-600">
                🏆 {a.title}
              </span>
            ))}
          </div>
        ) : null}

        {!isBlogger && settings && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {settings.acceptsOrders === false ? <Badge tone="red">Not taking orders right now</Badge> : <Badge tone="green">Taking orders</Badge>}
            {settings.offersDelivery && (
              <Badge tone="gray">
                <LuBike /> Delivery {settings.deliveryFee ? `· ${formatPKR(settings.deliveryFee)}` : ""}
              </Badge>
            )}
            {settings.offersPickup !== false && (
              <Badge tone="gray">
                <LuShoppingBag /> Pickup
              </Badge>
            )}
            {settings.minimumOrder ? <Badge tone="gray">Min order {formatPKR(settings.minimumOrder)}</Badge> : null}
            {settings.averagePrepMinutes ? (
              <Badge tone="gray">
                <LuClock /> ~{settings.averagePrepMinutes} min
              </Badge>
            ) : null}
          </div>
        )}

        {deals.data?.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {deals.data.slice(0, 2).map((d) => (
              <OfferBanner
                key={d._id}
                onMenu={() => {
                  setTab("menu");
                  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                deal={{ ...d, profile: p, foods: (d as never as { foods?: [] }).foods || [] } as never}
              />
            ))}
          </div>
        ) : null}

        <div id="menu" className="scroll-mt-24" />
        <Tabs className="mt-6 w-fit" value={tab} onChange={setTab} tabs={tabs} />

        <div className="mt-5">
          {tab === "menu" &&
            (foods.isLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[240px] rounded-2xl" />
                ))}
              </div>
            ) : !foods.data?.length ? (
              <EmptyState icon={<LuStore />} title="Menu coming soon" text={mine ? "You have not added dishes yet. Add them from the dashboard (Menu) so customers can order." : `${p.displayName} has not added dishes yet.`} />
            ) : (
              <div className="space-y-8">
                {categories.map(([name, list]) => (
                  <section key={name}>
                    <h3 className="mb-3 text-lg font-bold text-navy-900">{name}</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                      {(list || []).map((f) => (
                        <DishCard key={f._id} food={f} showSeller={false} compact />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ))}

          {tab === "posts" &&
            (posts.isLoading ? (
              <Skeleton className="h-72" />
            ) : !posts.data?.items.length ? (
              <EmptyState title="No posts yet" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {posts.data.items.map((post) =>
                  post.postType === "REEL" ? (
                    <ReelCard key={post._id} post={{ ...post, author: { ...post.author, ...p } }} />
                  ) : (
                    <Link key={post._id} href={post.linkedFood?._id ? `/food/${post.linkedFood._id}` : "#"} className="group relative block aspect-[10/14] overflow-hidden rounded-2xl">
                      <SmartImage src={primaryImage(post.media)} alt={post.caption || "Post"} hint={post.caption} className="absolute inset-0" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                        <p className="line-clamp-2 text-xs text-white">{post.caption}</p>
                        <p className="mt-1 text-[10px] text-white/70">
                          {titleCase(post.postType)} · {formatCompact(post.stats.likes)} likes
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            ))}

          {tab === "reviews" && (
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              <RatingSummary distribution={reviews.data?.meta?.distribution} average={rating.average} count={rating.count} />
              <ReviewList reviews={reviews.data?.items} loading={reviews.isLoading} />
            </div>
          )}

          {tab === "about" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <h3 className="font-bold text-navy-900">About</h3>
                <p className="mt-2 text-sm whitespace-pre-line text-ink-600">{p.bio || "No description yet."}</p>
                {(p.specialties?.length || 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.specialties!.map((s) => (
                      <Badge key={s} tone="orange">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-4 space-y-2 text-sm text-ink-700">
                  {p.address?.city && (
                    <p className="flex items-start gap-2">
                      <LuMapPin className="mt-0.5 shrink-0 text-brand-500" /> {[p.address.line1, p.address.area, p.address.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {p.contact?.phone && (
                    <a href={`tel:${p.contact.phone}`} className="flex items-center gap-2 hover:text-brand-600">
                      <LuPhone className="text-brand-500" /> {p.contact.phone}
                    </a>
                  )}
                  {p.contact?.website && (
                    <a href={p.contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-600">
                      <LuGlobe className="text-brand-500" /> {p.contact.website}
                    </a>
                  )}
                  {p.contact?.instagram && (
                    <a href={`https://instagram.com/${p.contact.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-600">
                      <LuInstagram className="text-brand-500" /> {p.contact.instagram}
                    </a>
                  )}
                  {p.contact?.facebook && (
                    <a href={p.contact.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-600">
                      <LuFacebook className="text-brand-500" /> Facebook
                    </a>
                  )}
                </div>
              </div>
              {!isBlogger && (
                <div className="card p-5">
                  <h3 className="font-bold text-navy-900">Opening hours</h3>
                  {p.openingHours?.length ? (
                    <ul className="mt-3 divide-y divide-ink-100 text-sm">
                      {DAYS.map((d) => {
                        const h = p.openingHours!.find((o) => o.day === d);
                        return (
                          <li key={d} className="flex justify-between py-2">
                            <span className="font-medium text-ink-700">{titleCase(d)}</span>
                            <span className={h && !h.closed ? "text-ink-800" : "text-ink-400"}>{h && !h.closed ? `${h.open} - ${h.close}` : "Closed"}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-ink-500">Hours not shared yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
