"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { LuChevronDown, LuChevronRight, LuFlame, LuGift, LuMapPin, LuPlay, LuSearch, LuSlidersHorizontal, LuSparkles, LuUtensilsCrossed, LuWandSparkles } from "react-icons/lu";

import { FoodArt, HeroArt, type CuisineKey } from "@/components/brand/FoodArt";
import { CreatorCard, CuisineCircle, DishCard, OfferBanner, PlaceCard, ReelCard } from "@/components/cards/Cards";
import { Avatar, SectionHeader, Skeleton, scrollRow } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { catalogApi, discoveryApi, recommendationApi, socialApi } from "@/services/foodmart";
import { cn, formatCompact, primaryImage } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { CITIES, locationParams, useLocationStore } from "@/store/locationStore";
import type { Post } from "@/lib/types";

/* =========================================================
   HOME (FoodMart design)
   Hero · For You reels · Popular Cuisines · Trending Restaurants
   · Nearby Food Points · Special Offers · Bloggers & Chefs
   Every section reads live data from the FoodMart backend.
========================================================= */

export const CUISINES: { label: string; kind: CuisineKey; q: string }[] = [
  { label: "Biryani", kind: "biryani", q: "biryani" },
  { label: "Burgers", kind: "burger", q: "burger" },
  { label: "Pizza", kind: "pizza", q: "pizza" },
  { label: "BBQ", kind: "bbq", q: "bbq" },
  { label: "Desi", kind: "desi", q: "karahi" },
  { label: "Chinese", kind: "chinese", q: "chinese" },
  { label: "Desserts", kind: "dessert", q: "dessert" },
  { label: "Drinks", kind: "drink", q: "drinks" },
];

const CHIPS = ["Biryani", "Burgers", "Pizza", "BBQ", "Desi Food", "Chinese", "Desserts", "Drinks"];

/* ---------------- hero ---------------- */

function HeroSearch() {
  const router = useRouter();
  const { city, setCity } = useLocationStore();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : "/explore");
  };
  return (
    <form onSubmit={submit} className="flex h-14 items-center rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card">
      <label className="relative hidden h-full items-center gap-1.5 border-r border-ink-100 pr-3 pl-3 text-[13px] font-medium text-ink-800 sm:flex">
        <LuMapPin className="shrink-0 text-brand-500" />
        <select value={city} onChange={(e) => setCity(e.target.value)} className="cursor-pointer appearance-none bg-transparent pr-5 outline-none" aria-label="City">
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}, Pakistan
            </option>
          ))}
        </select>
        <LuChevronDown className="pointer-events-none absolute right-2 text-ink-400" />
      </label>
      <LuSearch className="ml-3 shrink-0 text-lg text-ink-500" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for biryani, burgers, cafes, food points..." className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-ink-400" aria-label="Search food" />
      <button type="submit" className="brand-gradient flex h-full w-12 shrink-0 items-center justify-center rounded-xl text-lg text-white shadow-glow" aria-label="Search">
        <LuSearch />
      </button>
    </form>
  );
}

function MiniReel({ post, fallbackTitle, fallbackKind, views, className }: { post?: Post; fallbackTitle: string; fallbackKind: CuisineKey; views: string; className?: string }) {
  const title = post ? post.linkedFood?.name || post.caption?.split("\n")[0] || fallbackTitle : fallbackTitle;
  return (
    <Link href={post ? `/reels?start=${post._id}` : "/reels"} className={cn("group relative block overflow-hidden rounded-2xl border-4 border-white bg-night-900 shadow-pop", className)}>
      <SmartImage src={post ? post.reel?.thumbnailUrl || primaryImage(post.media) : null} alt={title} kind={post ? undefined : fallbackKind} hint={title} dark className="absolute inset-0 transition duration-500 group-hover:scale-105" />
      <div className="reel-shade absolute inset-0" />
      <p className="absolute top-3 left-3 max-w-[70%] text-[15px] leading-tight font-bold text-white drop-shadow">{title}</p>
      <p className="absolute bottom-3 left-3 text-[11px] text-white/85">{post ? `${formatCompact(post.reel?.viewCount || post.stats?.views)} views` : views}</p>
      <span className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-500 shadow">
        <LuPlay className="ml-0.5 fill-brand-500 text-sm" />
      </span>
    </Link>
  );
}

function Hero({ reels }: { reels?: Post[] }) {
  const city = useLocationStore((s) => s.city);
  const bloggers = useQuery({ queryKey: ["home-bloggers"], queryFn: () => discoveryApi.profiles({ type: "BLOGGER", sort: "followers", limit: 4 }) });
  const fans = (bloggers.data?.items || []).reduce((n, p) => n + (p.stats?.followers || 0), 0);
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="container-fm grid items-center gap-6 pt-5 pb-6 md:grid-cols-[1.05fr_1fr] md:pt-8 lg:gap-4 lg:pt-10 lg:pb-8">
        {/* mobile search (design mobile) */}
        <div className="flex gap-2 md:hidden">
          <Link href="/explore" className="flex h-11 flex-1 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-[13px] text-ink-400">
            <LuSearch className="text-lg text-ink-500" /> Search for food, restaurants...
          </Link>
          <Link href="/explore?filters=1" className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-500" aria-label="Filters">
            <LuSlidersHorizontal />
          </Link>
        </div>

        <div className="relative z-10">
          <p className="mb-3 hidden text-[11px] font-bold tracking-[0.12em] text-brand-500 uppercase lg:block">
            Restaurants <span className="mx-1.5">•</span> Street Food <span className="mx-1.5">•</span> Bloggers <span className="mx-1.5">•</span> Chefs <span className="mx-1.5">•</span> Local Food Points
          </p>
          <div className="flex items-start gap-3">
            <h1 className="text-[34px] leading-[1.05] font-extrabold tracking-tight text-navy-900 xs:text-[40px] sm:text-5xl lg:text-[64px]">
              Discover Food
              <br />
              <span className="text-brand-gradient">You&apos;ll Love</span>
            </h1>
            <div className="ml-auto h-28 w-28 shrink-0 md:hidden">
              <FoodArt kind="biryani" />
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm text-ink-600 sm:text-base">Explore amazing restaurants, hidden food points, top chefs, food bloggers and local flavors — all in one place.</p>
          <div className="mt-6 hidden max-w-xl md:block">
            <HeroSearch />
          </div>
          <div className="mt-4 hidden flex-wrap gap-1.5 lg:flex">
            {CHIPS.map((c) => (
              <Link
                key={c}
                href={`/explore?q=${encodeURIComponent(c.replace(" Food", ""))}`}
                className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        {/* art + floating cards (tablet / desktop) */}
        <div className="relative hidden h-[300px] md:block lg:h-[380px]">
          <p className="absolute top-2 left-0 z-20 hidden -rotate-12 font-script text-[26px] leading-[0.95] font-bold text-navy-900 lg:block">
            Good
            <br />
            Food
            <br />
            Brighter
            <br />
            &nbsp;&nbsp;Days
            <LuWandSparkles className="absolute -top-3 -right-6 text-xl text-brand-500" />
          </p>
          <HeroArt className="absolute top-0 right-0 h-[86%] w-auto max-w-full drop-shadow-2xl lg:right-auto lg:left-[14%] lg:max-w-[78%]" />
          <Link href="/reels" className="grape-gradient absolute bottom-2 left-[18%] z-20 hidden w-[250px] items-center gap-3 rounded-2xl p-4 text-white shadow-grape lg:flex">
            <div className="min-w-0 flex-1">
              <p className="text-lg leading-tight font-semibold">
                {city}
                <br />
                Food Trails
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {(bloggers.data?.items || []).slice(0, 3).map((b) => (
                    <Avatar key={b._id} src={b.avatar?.url} name={b.displayName} size={26} ring />
                  ))}
                  {!bloggers.data?.items?.length && [0, 1, 2].map((i) => <Avatar key={i} name={["A K", "S M", "H R"][i]} size={26} ring />)}
                </div>
                <p className="text-[11px] leading-tight text-white/85">
                  <b className="block text-[13px] text-white">+{fans ? formatCompact(fans) : "12K"}</b>food lovers
                </p>
              </div>
            </div>
            <span className="brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-glow">
              <LuPlay className="ml-0.5 fill-white text-lg" />
            </span>
          </Link>
          <div className="absolute top-0 right-0 z-10 hidden w-[170px] flex-col gap-3 lg:flex">
            <MiniReel post={reels?.[0]} fallbackTitle="Burgers That Hit Different" fallbackKind="burger" views="Watch reels" className="h-[140px] lg:h-[170px]" />
            <MiniReel post={reels?.[1]} fallbackTitle="Street Food Stories" fallbackKind="bbq" views="Watch reels" className="h-[120px] lg:h-[150px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- sections ---------------- */

function Row({ children, rowRef, className }: { children: ReactNode; rowRef?: RefObject<HTMLDivElement | null>; className?: string }) {
  return (
    <div ref={rowRef} className={cn("snap-row -mx-4 px-4 pb-2 sm:mx-0 sm:px-0", className)}>
      {children}
    </div>
  );
}

function ForYou({ reels, loading }: { reels?: Post[]; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="container-fm py-5">
      <SectionHeader icon={<LuSparkles />} title="For You" subtitle="Personalized restaurant reels and food stories just for you." inline href="/reels" onPrev={() => scrollRow(ref.current, -1)} onNext={() => scrollRow(ref.current, 1)} />
      <Row rowRef={ref}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[10/14] w-[46%] shrink-0 rounded-2xl sm:w-[200px]" />)
          : (reels || []).map((post) => <ReelCard key={post._id} post={post} className="w-[46%] shrink-0 sm:w-[190px] xl:w-[calc((100%-80px)/6)]" />)}
        {!loading && !reels?.length && (
          <Link href="/reels" className="flex aspect-[10/14] w-[46%] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-500 sm:w-[200px]">
            <LuPlay className="mb-2 text-2xl text-brand-500" />
            Reels from restaurants and bloggers appear here.
          </Link>
        )}
      </Row>
    </section>
  );
}

function Cuisines() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="container-fm py-5">
      <div className="flex items-center gap-4">
        <div className="hidden shrink-0 items-start gap-2 whitespace-nowrap md:flex">
          <LuUtensilsCrossed className="mt-1 text-2xl text-brand-500" />
          <div>
            <h2 className="text-[22px] leading-tight font-bold text-navy-900">Popular Cuisines</h2>
            <p className="text-[13px] text-ink-500">Explore your favorite flavors</p>
          </div>
        </div>
        <div ref={ref} className="no-scrollbar flex flex-1 gap-2 overflow-x-auto scroll-smooth py-2 sm:gap-3 lg:justify-between">
          {CUISINES.map((c) => (
            <CuisineCircle key={c.label} label={c.label} kind={c.kind} href={`/explore?q=${encodeURIComponent(c.q)}`} />
          ))}
        </div>
        <button onClick={() => scrollRow(ref.current, 1)} className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-card hover:text-brand-500 md:flex lg:hidden xl:flex" aria-label="More cuisines">
          <LuChevronRight />
        </button>
      </div>
    </section>
  );
}

function PlacesSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[230px] w-[46%] shrink-0 rounded-2xl sm:w-[200px] xl:w-auto" />
      ))}
    </>
  );
}

function TrendingAndNearby() {
  const { city, coords } = useLocationStore();
  const loc = locationParams({ city, coords });
  const trending = useQuery({ queryKey: ["home-trending-restaurants", city], queryFn: () => discoveryApi.profiles({ type: "RESTAURANT", sort: "rating", city, limit: 6 }) });
  const trendingAll = useQuery({
    queryKey: ["home-trending-restaurants-all"],
    queryFn: () => discoveryApi.profiles({ type: "RESTAURANT", sort: "rating", limit: 6 }),
    enabled: trending.isSuccess && !trending.data?.items.length,
  });
  const nearby = useQuery({
    queryKey: ["home-nearby-points", loc],
    queryFn: () => discoveryApi.nearby({ type: "sellers", sellerType: "LOCAL_POINT", radiusKm: 25, limit: 6, ...loc }),
    retry: false,
  });
  const pointsAll = useQuery({
    queryKey: ["home-points-all"],
    queryFn: () => discoveryApi.profiles({ type: "LOCAL_POINT", sort: "rating", limit: 6 }),
    enabled: nearby.isError || (nearby.isSuccess && !nearby.data?.items.length),
  });
  const restaurants = trending.data?.items.length ? trending.data.items : trendingAll.data?.items || [];
  const points: { profile: any; km?: number }[] = nearby.data?.items.length ? nearby.data.items.map((p) => ({ profile: p, km: p.distanceKm })) : (pointsAll.data?.items || []).map((p) => ({ profile: p }));

  return (
    <section className="container-fm grid gap-8 py-5 xl:grid-cols-2 xl:gap-6">
      <div className="min-w-0">
        <SectionHeader icon={<LuFlame />} title="Trending Restaurants" subtitle="Most loved by foodies this week" href="/restaurants" />
        <Row className="xl:grid xl:grid-cols-3 xl:overflow-visible">
          {trending.isLoading ? <PlacesSkeleton /> : restaurants.slice(0, 3).map((p) => <PlaceCard key={p._id} profile={p} className="w-[46%] shrink-0 sm:w-[210px] xl:w-auto" />)}
          {!trending.isLoading && !restaurants.length && <p className="py-8 text-sm text-ink-500">No restaurants yet in {city}.</p>}
        </Row>
      </div>
      <div className="min-w-0">
        <SectionHeader icon={<LuMapPin />} title="Nearby Food Points" subtitle="Hidden gems near you" href="/food-points" />
        <Row className="xl:grid xl:grid-cols-3 xl:overflow-visible">
          {nearby.isLoading ? <PlacesSkeleton /> : points.slice(0, 3).map(({ profile, km }) => <PlaceCard key={profile._id} profile={profile} distanceKm={km} className="w-[46%] shrink-0 sm:w-[210px] xl:w-auto" />)}
          {!nearby.isLoading && !pointsAll.isLoading && !points.length && <p className="py-8 text-sm text-ink-500">No food points found near {city} yet.</p>}
        </Row>
      </div>
    </section>
  );
}

function SpecialOffers() {
  const ref = useRef<HTMLDivElement>(null);
  const trending = useQuery({ queryKey: ["home-trending-foods"], queryFn: () => discoveryApi.trending({ limit: 10 }) });
  const foods = trending.data?.foods || [];
  return (
    <section className="container-fm py-5">
      <SectionHeader icon={<LuGift />} title="Special Offers" subtitle="Most popular dishes right now" href="/offers" onPrev={() => scrollRow(ref.current, -1)} onNext={() => scrollRow(ref.current, 1)} />
      <Row rowRef={ref}>
        {trending.isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[230px] w-[46%] shrink-0 rounded-2xl sm:w-[220px]" />)
          : foods.map((f) => <DishCard key={f._id} food={f} compact className="w-[46%] shrink-0 sm:w-[220px] xl:w-[calc((100%-64px)/5)]" />)}
        {!trending.isLoading && !foods.length && <p className="py-8 text-sm text-ink-500">Popular dishes appear here once restaurants add their menus.</p>}
      </Row>
    </section>
  );
}

function OffersAndCreators() {
  const city = useLocationStore((s) => s.city);
  const deals = useQuery({ queryKey: ["home-deals", city], queryFn: () => catalogApi.deals({ limit: 6 }) });
  const creators = useQuery({ queryKey: ["home-creators"], queryFn: () => discoveryApi.profiles({ type: "BLOGGER,CHEF", sort: "followers", limit: 12 }) });
  const deal = deals.data?.[0];
  if (!deal && !creators.data?.items.length) return null;
  return (
    <section className="container-fm grid gap-6 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {deal && (
        <div className="min-w-0">
          <SectionHeader icon={<LuGift />} title="Today's Deal" href="/offers" />
          <OfferBanner deal={deal as never} />
        </div>
      )}
      {creators.data?.items.length ? (
        <div className="min-w-0">
          <SectionHeader icon={<LuSparkles />} title="Top Food Bloggers & Chefs" href="/bloggers" />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {creators.data.items.map((p) => (
              <CreatorCard key={p._id} profile={p} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PickedForYou() {
  const user = useAuthStore((s) => s.user);
  const ref = useRef<HTMLDivElement>(null);
  const recs = useQuery({ queryKey: ["home-recs", user?._id], queryFn: () => recommendationApi.list("FOR_YOU", 10), enabled: Boolean(user) });
  if (!user || !recs.data?.items.length) return null;
  return (
    <section className="container-fm py-5">
      <SectionHeader icon={<LuWandSparkles />} title="Picked For You" subtitle="Based on your tastes, orders and saves" onPrev={() => scrollRow(ref.current, -1)} onNext={() => scrollRow(ref.current, 1)} />
      <Row rowRef={ref}>
        {recs.data.items.map((r) => (
          <div key={r.recommendationId} className="w-[46%] shrink-0 sm:w-[220px]">
            <DishCard food={r.food} compact />
            <p className="mt-1.5 line-clamp-2 px-1 text-[11px] text-grape-700">✨ {r.reason}</p>
          </div>
        ))}
      </Row>
    </section>
  );
}

export default function HomePage() {
  const reels = useQuery({ queryKey: ["home-reels"], queryFn: () => socialApi.reels({ limit: 12 }) });
  return (
    <>
      <Hero reels={reels.data?.items} />
      <ForYou reels={reels.data?.items} loading={reels.isLoading} />
      <Cuisines />
      <PickedForYou />
      <TrendingAndNearby />
      <SpecialOffers />
      <OffersAndCreators />
    </>
  );
}
