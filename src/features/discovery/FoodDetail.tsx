"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LuBadgeCheck, LuChevronRight, LuClock, LuHeart, LuMinus, LuPlus, LuShoppingBag, LuStore, LuTicketPercent } from "react-icons/lu";

import { dealLabel, DishCard } from "@/components/cards/Cards";
import { FavoriteMealPicker } from "@/components/cards/MealPicker";
import { mealsText } from "@/lib/meals";
import { Avatar, Badge, Button, ErrorState, PageLoader, Rating } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { useAddToCart } from "@/hooks/useCart";
import { useFavorite } from "@/hooks/useSocial";
import { getErrorMessage } from "@/services/api";
import { catalogApi, reviewApi } from "@/services/foodmart";
import { cn, formatDate, formatPKR, profilePath, PROFILE_TYPE_LABEL, titleCase } from "@/lib/utils";
import { ReviewList } from "./ProfileDetail";

/* =========================================================
   FOOD DETAIL
   Backend: GET /foods/:id (with activeDeals + viewer), /foods/:id/reviews,
   /foods/:id/similar; PUT /cart/items; PUT/DELETE /foods/:id/favorite
========================================================= */

export default function FoodDetail({ id }: { id: string }) {
  const foodQ = useQuery({ queryKey: ["food", id], queryFn: () => catalogApi.food(id) });
  const reviews = useQuery({ queryKey: ["food-reviews", id], queryFn: () => reviewApi.foodReviews(id, { limit: 10 }) });
  const similar = useQuery({ queryKey: ["food-similar", id], queryFn: () => catalogApi.similar(id) });
  const food = foodQ.data;
  if (foodQ.isLoading) return <PageLoader />;
  if (foodQ.isError || !food) return <div className="container-fm py-10"><ErrorState message={getErrorMessage(foodQ.error, "Dish not found.")} onRetry={() => foodQ.refetch()} /></div>;
  return <FoodView food={food} reviews={reviews.data?.items} reviewsLoading={reviews.isLoading} similar={similar.data || []} />;
}

function FoodView({ food, reviews, reviewsLoading, similar }: { food: NonNullable<Awaited<ReturnType<typeof catalogApi.food>>>; reviews?: any[]; reviewsLoading: boolean; similar: any[] }) {
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const fav = useFavorite(food._id, Boolean(food.viewer?.isFavorite), food.viewer?.mealSlots);
  const cart = useAddToCart();
  const seller = food.seller;
  const images = food.media?.length ? food.media : [{ url: "", isPrimary: true }];
  const orderable = food.orderableNow !== false && food.isAvailable && food.isOrderable !== false;

  return (
    <div className="container-fm py-6 sm:py-8">
      <nav className="mb-4 flex items-center gap-1 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-500">
          Home
        </Link>
        <LuChevronRight />
        <Link href={profilePath(seller)} className="hover:text-brand-500">
          {seller.displayName}
        </Link>
        <LuChevronRight />
        <span className="truncate text-ink-800">{food.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="relative overflow-hidden rounded-3xl shadow-card">
            <SmartImage src={images[active]?.url || null} alt={food.name} hint={food.cuisine} className="aspect-[4/3] w-full" sizes="(max-width: 1024px) 100vw, 600px" priority />
            <button
              onClick={fav.toggle}
              className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow"
              aria-label="Favourite"
              aria-pressed={fav.on}
            >
              <LuHeart className={cn("text-xl", fav.on && "fill-brand-500 text-brand-500")} />
            </button>
          </div>
          {fav.on && (
            <button onClick={fav.openPicker} className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-600">
              <LuHeart className="fill-brand-500 text-brand-500" />
              {fav.slots.length ? `Favourite for ${mealsText(fav.slots)}` : "Choose a meal for this favourite"} · Edit
            </button>
          )}
          <FavoriteMealPicker fav={fav} name={food.name} />
          {food.media?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {food.media.map((m, i) => (
                <button key={m.url} onClick={() => setActive(i)} className={cn("overflow-hidden rounded-xl ring-2", i === active ? "ring-brand-500" : "ring-transparent")}>
                  <SmartImage src={m.url} alt={`${food.name} ${i + 1}`} className="h-16 w-20" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {food.cuisine && <Badge tone="orange">{titleCase(food.cuisine)}</Badge>}
            {typeof food.category === "object" && <Badge tone="gray">{food.category.name}</Badge>}
            {(food.tags || []).slice(0, 3).map((t) => (
              <Badge key={t} tone="purple">
                #{t}
              </Badge>
            ))}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-navy-900 sm:text-4xl">{food.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-600">
            <Rating value={food.rating?.average} count={food.rating?.count} className="text-sm" />
            {food.prepMinutes ? (
              <span className="flex items-center gap-1">
                <LuClock /> {food.prepMinutes} min
              </span>
            ) : null}
            {food.stats?.orders ? <span>{food.stats.orders.toLocaleString()} orders</span> : null}
          </div>
          <p className="mt-4 text-3xl font-extrabold text-brand-600">{formatPKR(food.price)}</p>
          {food.description && <p className="mt-3 text-sm leading-relaxed text-ink-600">{food.description}</p>}
          {food.ingredients?.length ? <p className="mt-2 text-xs text-ink-500">Ingredients: {food.ingredients.join(", ")}</p> : null}

          {food.activeDeals?.length ? (
            <div className="mt-4 space-y-2">
              {food.activeDeals.map((d) => (
                <div key={d._id} className="flex items-center gap-3 rounded-2xl border border-grape-100 bg-grape-50 p-3 text-sm">
                  <LuTicketPercent className="shrink-0 text-xl text-grape-600" />
                  <div className="min-w-0">
                    <p className="font-semibold text-grape-700">
                      {dealLabel(d)} · {d.title}
                    </p>
                    <p className="text-xs text-grape-700/80">
                      {d.minOrderAmount ? `On orders above ${formatPKR(d.minOrderAmount)} · ` : ""}Ends {formatDate(d.endsAt)} · applied automatically at checkout
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!orderable && <p className="mt-4 rounded-2xl bg-warning-50 p-3 text-sm font-medium text-warning-600">{food.unavailableReason || "This dish is not available right now."}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center rounded-full border border-ink-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-12 w-12 items-center justify-center text-ink-600" aria-label="Less">
                <LuMinus />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="flex h-12 w-12 items-center justify-center text-ink-600" aria-label="More">
                <LuPlus />
              </button>
            </div>
            <Button size="lg" icon={<LuShoppingBag />} disabled={!orderable} loading={cart.isPending} onClick={() => cart.add(food._id, food.name, qty, typeof food.seller === "object" ? food.seller?._id : (food.seller as string))} className="flex-1 sm:flex-none">
              Add to cart · {formatPKR(food.price * qty)}
            </Button>
          </div>

          <Link href={profilePath(seller)} className="card mt-6 flex items-center gap-3 p-4 transition hover:border-brand-200">
            <Avatar src={seller.avatar?.url} name={seller.displayName} size={48} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 font-semibold text-navy-900">
                {seller.displayName} {seller.verificationStatus === "VERIFIED" && <LuBadgeCheck className="text-grape-600" />}
              </p>
              <p className="text-xs text-ink-500">
                {PROFILE_TYPE_LABEL[seller.profileType]} {seller.address?.city ? `· ${seller.address.city}` : ""}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-500">
              <LuStore /> View menu
            </span>
          </Link>
        </div>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="mb-3 text-xl font-bold text-navy-900">Reviews</h2>
          <ReviewList reviews={reviews} loading={reviewsLoading} />
        </div>
        {similar.length > 0 && (
          <div>
            <h2 className="mb-3 text-xl font-bold text-navy-900">You may also like</h2>
            <div className="grid grid-cols-2 gap-3">
              {similar.slice(0, 4).map((f) => (
                <DishCard key={f._id} food={f} compact />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
