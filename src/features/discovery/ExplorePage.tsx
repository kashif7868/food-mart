"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LuBadgeCheck, LuHash, LuSearch, LuSlidersHorizontal, LuUtensilsCrossed, LuX } from "react-icons/lu";

import { DishCard, PlaceCard, ReelCard } from "@/components/cards/Cards";
import { Button, Chip, EmptyState, ErrorState, Modal, Skeleton, Tabs } from "@/components/ui";
import { MEALS } from "@/lib/meals";
import { getErrorMessage } from "@/services/api";
import { catalogApi, discoveryApi, socialApi } from "@/services/foodmart";
import { cn } from "@/lib/utils";
import { locationParams, useLocationStore } from "@/store/locationStore";
import { CUISINES } from "@/features/home/HomePage";
import { CuisineCircle } from "@/components/cards/Cards";

/* =========================================================
   EXPLORE
   - With a search term: GET /search (dishes, places, posts)
   - Browsing: GET /foods (filters + sort), GET /discovery/nearby,
     GET /profiles, GET /feed
========================================================= */

type Tab = "dishes" | "places" | "posts";

interface Filters {
  sort: "" | "popular" | "rating" | "price_asc" | "price_desc";
  maxPrice: string;
  sellerType: string;
  verified: boolean;
  nearby: boolean;
}
const DEFAULT_FILTERS: Filters = { sort: "popular", maxPrice: "", sellerType: "", verified: false, nearby: false };

function FiltersPanel({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const pill = (active: boolean) => cn("rounded-full border px-3 py-1.5 text-xs font-medium", active ? "border-brand-500 bg-brand-500 text-white" : "border-ink-200 text-ink-600 hover:border-brand-300");
  return (
    <div className="space-y-5">
      <div>
        <p className="label">Sort by</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["popular", "Most ordered"],
            ["rating", "Top rated"],
            ["price_asc", "Price: low to high"],
            ["price_desc", "Price: high to low"],
          ].map(([v, l]) => (
            <button key={v} className={pill(value.sort === v)} onClick={() => set({ sort: v as Filters["sort"] })}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Budget</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["", "Any"],
            ["500", "Under Rs. 500"],
            ["1000", "Under Rs. 1,000"],
            ["2000", "Under Rs. 2,000"],
          ].map(([v, l]) => (
            <button key={v} className={pill(value.maxPrice === v)} onClick={() => set({ maxPrice: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">From</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["", "Everyone"],
            ["RESTAURANT", "Restaurants"],
            ["CHEF", "Home chefs"],
            ["LOCAL_POINT", "Food points"],
          ].map(([v, l]) => (
            <button key={v} className={pill(value.sellerType === v)} onClick={() => set({ sellerType: v })}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={pill(value.verified)} onClick={() => set({ verified: !value.verified })}>
          <LuBadgeCheck className="mr-1 inline" /> Verified sellers
        </button>
        <button className={pill(value.nearby)} onClick={() => set({ nearby: !value.nearby })}>
          Near me (5 km)
        </button>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") || "";
  const [term, setTerm] = useState(q);
  const [tab, setTab] = useState<Tab>("dishes");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  /* breakfast / lunch / dinner...: shows dishes sellers tagged for that meal (?meal=BREAKFAST) */
  const [meal, setMeal] = useState(() => {
    const m = (params.get("meal") || "").toUpperCase();
    return MEALS.some((x) => x.value === m) ? m : "";
  });
  const [showFilters, setShowFilters] = useState(params.get("filters") === "1");
  const { city, coords } = useLocationStore();

  useEffect(() => {
    setTerm(q);
  }, [q]);

  const searching = q.trim().length >= 2;
  const search = useQuery({ queryKey: ["search", q], queryFn: () => discoveryApi.search(q, "all", 24), enabled: searching });

  const dishes = useInfiniteQuery({
    queryKey: ["explore-dishes", filters, meal, city, coords],
    initialPageParam: 1,
    enabled: !searching && tab === "dishes",
    queryFn: async ({ pageParam }) => {
      if (filters.nearby) {
        const r = await discoveryApi.nearby({ type: "foods", radiusKm: 5, limit: 40, maxPrice: filters.maxPrice || undefined, verified: filters.verified || undefined, ...locationParams({ city, coords }) });
        return { items: r.items, meta: { page: 1, totalPages: 1 } };
      }
      const base = { mealType: meal || undefined, sort: filters.sort || undefined, maxPrice: filters.maxPrice || undefined, sellerType: filters.sellerType || undefined, verified: filters.verified || undefined, page: pageParam, limit: 20 };
      const r = await catalogApi.foods({ ...base, city });
      /* nothing listed in this city yet -> show dishes from all cities */
      if (!r.items.length && pageParam === 1) {
        const all = await catalogApi.foods(base);
        return { items: all.items, meta: all.meta };
      }
      return { items: r.items, meta: r.meta };
    },
    getNextPageParam: (last) => (last.meta && last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
  const places = useQuery({ queryKey: ["explore-places", city], queryFn: () => discoveryApi.profiles({ city, sort: "rating", limit: 24 }), enabled: !searching && tab === "places" });
  const posts = useQuery({ queryKey: ["explore-posts"], queryFn: () => socialApi.feed({ scope: "all", limit: 24 }), enabled: !searching && tab === "posts" });
  const trending = useQuery({ queryKey: ["explore-trending"], queryFn: () => discoveryApi.trending({ limit: 6 }) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(term.trim() ? `/explore?q=${encodeURIComponent(term.trim())}` : "/explore");
  };

  const dishItems = searching ? search.data?.foods || [] : dishes.data?.pages.flatMap((p) => p.items) || [];
  const placeItems = searching ? search.data?.profiles || [] : places.data?.items || [];
  const postItems = searching ? search.data?.posts || [] : posts.data?.items || [];
  const loading = searching ? search.isLoading : tab === "dishes" ? dishes.isLoading : tab === "places" ? places.isLoading : posts.isLoading;
  const error = searching ? search.error : tab === "dishes" ? dishes.error : tab === "places" ? places.error : posts.error;
  const activeFilters = Object.entries(filters).filter(([k, v]) => (k === "sort" ? v !== "popular" : Boolean(v))).length;

  return (
    <div className="container-fm py-6 sm:py-8">
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <LuSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-lg text-ink-500" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search dishes, restaurants, chefs, #hashtags..." className="h-12 w-full rounded-full border border-ink-200 bg-white pr-10 pl-11 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-100" autoFocus={!q} />
          {term && (
            <button type="button" onClick={() => router.push("/explore")} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-ink-100" aria-label="Clear">
              <LuX />
            </button>
          )}
        </div>
        <button type="button" onClick={() => setShowFilters(true)} className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-lg text-brand-500" aria-label="Filters">
          <LuSlidersHorizontal />
          {activeFilters > 0 && <span className="brand-gradient absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">{activeFilters}</span>}
        </button>
      </form>

      {!searching && tab === "dishes" && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto" role="group" aria-label="Meal">
          <Chip active={meal === ""} onClick={() => setMeal("")}>
            All meals
          </Chip>
          {MEALS.map((m) => (
            <Chip key={m.value} active={meal === m.value} onClick={() => setMeal(m.value)}>
              <span aria-hidden>{m.emoji}</span> {m.label.split(" (")[0]}
            </Chip>
          ))}
        </div>
      )}

      {!searching && (
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto sm:gap-3">
          {CUISINES.map((c) => (
            <CuisineCircle key={c.label} label={c.label} kind={c.kind} href={`/explore?q=${encodeURIComponent(c.q)}`} />
          ))}
        </div>
      )}

      {trending.data?.hashtags?.length ? (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
          {trending.data.hashtags.slice(0, 10).map((h) => (
            <button key={h.tag} onClick={() => router.push(`/explore?q=${encodeURIComponent(`#${h.tag}`)}`)} className="flex shrink-0 items-center gap-1 rounded-full bg-grape-50 px-3 py-1.5 text-xs font-semibold text-grape-700">
              <LuHash /> {h.tag}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-navy-900 sm:text-2xl">{searching ? <>Results for &ldquo;{q}&rdquo;</> : "Explore food"}</h1>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "dishes", label: "Dishes", count: searching ? dishItems.length : undefined },
            { value: "places", label: "Places", count: searching ? placeItems.length : undefined },
            { value: "posts", label: "Posts & Reels", count: searching ? postItems.length : undefined },
          ]}
        />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState message={getErrorMessage(error)} />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-[240px] rounded-2xl" />
            ))}
          </div>
        ) : tab === "dishes" ? (
          dishItems.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
              {dishItems.map((f) => (
                <DishCard key={f._id} food={f} compact />
              ))}
            </div>
          ) : (
            <EmptyState icon={<LuUtensilsCrossed />} title="No dishes found" text={searching ? "Try another word, e.g. biryani or burger." : "Try removing some filters."} />
          )
        ) : tab === "places" ? (
          placeItems.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {placeItems.map((p) => (
                <PlaceCard key={p._id} profile={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No places found" />
          )
        ) : postItems.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {postItems.map((p) => (
              <ReelCard key={p._id} post={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No posts found" />
        )}
        {!searching && tab === "dishes" && dishes.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" loading={dishes.isFetchingNextPage} onClick={() => dishes.fetchNextPage()}>
              Load more dishes
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset
            </Button>
            <Button
              onClick={() => {
                setShowFilters(false);
                setTab("dishes");
                if (searching) router.push("/explore");
              }}
            >
              Show dishes
            </Button>
          </>
        }
      >
        <FiltersPanel value={filters} onChange={setFilters} />
      </Modal>
    </div>
  );
}
