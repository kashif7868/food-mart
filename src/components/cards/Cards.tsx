"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LuBadgeCheck, LuHeart, LuMapPin, LuPlay, LuPlus, LuTicketPercent, LuTimer } from "react-icons/lu";

import type { CuisineKey } from "@/components/brand/FoodArt";
import { FoodPhoto } from "@/components/ui/FoodPhoto";
import { Avatar, Rating } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { useAddToCart } from "@/hooks/useCart";
import { useFavorite, useFollow } from "@/hooks/useSocial";
import { FavoriteMealPicker } from "./MealPicker";
import { idOf, OWN_PROFILE_MESSAGE, useIsMine } from "@/hooks/useOwnership";
import { cn, cuisineLine, distanceLabel, durationLabel, formatCompact, formatPKR, primaryImage, profilePath, profileRating, PROFILE_TYPE_LABEL, titleCase } from "@/lib/utils";
import type { Deal, Food, MealSlot, Post, Profile } from "@/lib/types";

/* =========================================================
   CARDS (design): reel card, place card, dish card, cuisine
   circle, creator avatar, offer banner.
========================================================= */

const HeartButton = ({ on, onClick, className, label }: { on: boolean; onClick: () => void; className?: string; label: string }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    aria-label={label}
    aria-pressed={on}
    className={cn("flex h-8 w-8 items-center justify-center rounded-full transition", className)}
  >
    <LuHeart className={cn("text-[17px]", on ? "fill-brand-500 text-brand-500" : "")} />
  </button>
);

/* ---------- Reel card ("For You") ---------- */
export function ReelCard({ post, className }: { post: Post; className?: string }) {
  const title = post.linkedFood?.name || post.caption?.split("\n")[0] || "Food story";
  const category = post.linkedFood?.cuisine || post.author?.cuisines?.[0];
  const thumb = post.reel?.thumbnailUrl || primaryImage(post.media) || primaryImage(post.linkedFood?.media as never);
  const caption = post.caption && post.caption !== title ? post.caption : post.linkedFood?.description;
  return (
    <Link href={`/reels?start=${post._id}`} className={cn("group relative block aspect-[10/14] overflow-hidden rounded-2xl bg-night-900 shadow-card", className)}>
      <SmartImage src={thumb} alt={title} hint={`${title} ${category || ""}`} className="absolute inset-0 transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 45vw, 200px" />
      <div className="reel-shade absolute inset-0" />
      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
        <LuTimer /> {durationLabel(post.reel?.durationSeconds || post.reel?.presetSeconds) || "Reel"}
      </span>
      <span className="absolute top-2 right-2 text-white">
        <LuHeart className={cn("text-[18px] drop-shadow", post.viewer?.liked && "fill-brand-500 text-brand-500")} />
      </span>
      <span className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white backdrop-blur transition group-hover:scale-110">
        <LuPlay className="ml-0.5 fill-white text-lg" />
      </span>
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <div className="flex items-center gap-2">
          <Avatar src={post.author?.avatar?.url} name={post.author?.displayName} size={30} ring />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight">{title}</p>
            <p className="truncate text-[10px] text-white/80">{post.author?.displayName}</p>
            {category && <p className="truncate text-[10px] text-white/60">{titleCase(category)}</p>}
          </div>
        </div>
        {caption && <p className="mt-1.5 line-clamp-1 text-[11px] text-white/90">{caption}</p>}
      </div>
    </Link>
  );
}

/* ---------- Place card (Trending Restaurants / Nearby Food Points / listings) ---------- */
export function PlaceCard({ profile, distanceKm, className }: { profile: Profile & { viewer?: { isFollowing?: boolean } }; distanceKm?: number; className?: string }) {
  const follow = useFollow(profile._id, Boolean(profile.viewer?.isFollowing));
  const mine = useIsMine(profile._id);
  const rating = profileRating(profile);
  return (
    <Link href={profilePath(profile)} className={cn("group block overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop", className)}>
      <div className="relative">
        <SmartImage src={profile.cover?.url} alt={profile.displayName} hint={(profile.cuisines || []).join(" ")} className="aspect-[4/3] w-full" />
        {mine ? (
          <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-grape-700 shadow">Your profile</span>
        ) : (
          <HeartButton on={follow.on} onClick={follow.toggle} label="Follow" className="absolute top-2 right-2 bg-white/90 text-ink-800 shadow" />
        )}
        {profile.awards?.length ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-warning-400 px-2 py-0.5 text-[10px] font-bold text-night-900">🏆 {profile.awards[0].title}</span>
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1">
          <p className="truncate text-[13px] font-bold text-navy-900">{profile.displayName}</p>
          {profile.verificationStatus === "VERIFIED" && <LuBadgeCheck className="shrink-0 text-sm text-grape-600" title="Verified" />}
        </div>
        <Rating value={rating.average} count={rating.count} className="mt-0.5" />
        <p className="mt-0.5 truncate text-[11px] text-ink-500">{cuisineLine(profile.cuisines) || PROFILE_TYPE_LABEL[profile.profileType]}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
          <LuMapPin className="shrink-0" />
          <span className="truncate">{distanceKm !== undefined ? distanceLabel(distanceKm) : profile.address?.area || profile.address?.city || "Pakistan"}</span>
        </p>
      </div>
    </Link>
  );
}

/* ---------- Dish card (Special Offers / menus / explore) ---------- */
export function DishCard({ food, className, showSeller = true, compact = false }: { food: Food & { viewer?: { isFavorite?: boolean } }; className?: string; showSeller?: boolean; compact?: boolean }) {
  const fav = useFavorite(food._id, Boolean((food as { viewer?: { isFavorite?: boolean } }).viewer?.isFavorite), (food as { viewer?: { mealSlots?: MealSlot[] } }).viewer?.mealSlots);
  const cart = useAddToCart();
  const seller = typeof food.seller === "object" ? food.seller : null;
  const orders = food.stats?.orders || 0;
  return (
    <>
    <Link href={`/food/${food._id}`} className={cn("group block overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop", className)}>
      <div className="relative">
        <SmartImage src={primaryImage(food.media)} alt={food.name} hint={`${food.cuisine || ""}`} className={cn("w-full", compact ? "aspect-[4/3]" : "aspect-[5/4]")} />
        <HeartButton on={fav.on} onClick={fav.toggle} label="Favourite" className="absolute top-2 right-2 bg-white/90 text-ink-800 shadow" />
        {food.isAvailable === false && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[11px] font-semibold text-white">Not available now</span>}
      </div>
      <div className="p-3">
        <p className="truncate text-[13px] font-bold text-navy-900">{food.name}</p>
        {showSeller && seller?.displayName && <p className="truncate text-[11px] text-ink-500">{seller.displayName}</p>}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-brand-600">{formatPKR(food.price)}</p>
            <p className="text-[10px] text-ink-400">{orders ? `${formatCompact(orders)} orders` : food.rating?.count ? `★ ${food.rating.average.toFixed(1)}` : "New"}</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cart.add(food._id, food.name, 1, idOf(food.seller));
            }}
            disabled={food.isAvailable === false || cart.isPending}
            className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-glow transition hover:scale-105 disabled:opacity-40"
            aria-label={`Add ${food.name} to cart`}
          >
            <LuPlus />
          </button>
        </div>
      </div>
    </Link>
    <FavoriteMealPicker fav={fav} name={food.name} />
    </>
  );
}

/* ---------- Cuisine circle ---------- */
export function CuisineCircle({ label, kind, href, size = "md" }: { label: string; kind: CuisineKey; href: string; size?: "sm" | "md" }) {
  return (
    <Link href={href} className="group flex w-[72px] shrink-0 flex-col items-center gap-2 sm:w-[92px]">
      <span className={cn("overflow-hidden rounded-full bg-white p-0 shadow-card ring-1 ring-ink-100 transition group-hover:-translate-y-1 group-hover:shadow-glow", size === "sm" ? "h-14 w-14" : "h-[64px] w-[64px] sm:h-[84px] sm:w-[84px]")}>
        <FoodPhoto kind={kind} seed={label} alt={label} w={240} className="h-full w-full rounded-full" />
      </span>
      <span className="text-[11px] font-medium text-ink-800 sm:text-[13px]">{label}</span>
    </Link>
  );
}

/* ---------- Creator (blogger / chef) ---------- */
export function CreatorCard({ profile }: { profile: Profile }) {
  return (
    <Link href={profilePath(profile)} className="group flex w-20 shrink-0 flex-col items-center text-center">
      <span className="rounded-full bg-gradient-to-br from-brand-400 to-grape-600 p-[2px] transition group-hover:scale-105">
        <Avatar src={profile.avatar?.url} name={profile.displayName} size={60} ring />
      </span>
      <span className="mt-1.5 w-full truncate text-[11px] font-semibold text-navy-900">{profile.displayName}</span>
      <span className="text-[10px] text-ink-500">{PROFILE_TYPE_LABEL[profile.profileType]}</span>
    </Link>
  );
}

/* ---------- Offer banner (design "Flat 30% OFF") ---------- */
export const dealLabel = (deal: Pick<Deal, "dealType" | "value">) => (deal.dealType === "PERCENT" ? `Flat ${deal.value}% OFF` : `Rs. ${deal.value} OFF`);

/* "Order now" for an offer: one specific dish -> add it and open the cart;
   several dishes or the whole menu -> go to the seller's menu. Owners get an explanation. */
export function useDealOrder(deal: Deal, onMenu?: () => void) {
  const router = useRouter();
  const cart = useAddToCart();
  const profileId = idOf(deal.profile);
  const mine = useIsMine(profileId);
  const profile = typeof deal.profile === "object" ? (deal.profile as Profile) : null;
  const foods = (deal.foods || []).filter((f): f is Food => typeof f === "object" && Boolean(f?._id));
  const single = foods.length === 1 ? foods[0] : null;
  const order = async () => {
    if (mine) {
      toast.info(OWN_PROFILE_MESSAGE);
      return;
    }
    if (single) {
      const ok = await cart.addAndWait(single._id, single.name, 1, profileId);
      if (ok) router.push("/cart");
      return;
    }
    if (onMenu) onMenu();
    else router.push(`${profile?.slug ? profilePath(profile) : "/explore"}#menu`);
  };
  return { order, busy: cart.isPending, mine, single, foods, label: mine ? "Your offer" : single ? "Order now" : "View menu & order" };
}

export function OfferBanner({ deal, className, onMenu }: { deal: Deal & { profile: Partial<Profile>; foods?: Food[] }; className?: string; onMenu?: () => void }) {
  const food = deal.foods?.[0];
  const dealOrder = useDealOrder(deal as Deal, onMenu);
  const image = deal.image?.url || deal.video?.thumbnailUrl || primaryImage(food?.media);
  /* The offer picture fills the right half and fades into the purple card,
     so any uploaded image (even a screenshot) looks intentional, not like a pasted sticker. */
  return (
    <div className={cn("grape-gradient group relative isolate flex min-h-[176px] overflow-hidden rounded-3xl text-white shadow-grape", className)}>
      <div className="relative z-10 flex w-[62%] flex-col justify-center p-5 sm:p-6">
        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur">
          <LuTicketPercent /> Limited offer
        </span>
        <p className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{dealLabel(deal)}</p>
        <p className="mt-1 line-clamp-2 text-sm font-medium text-white/90 capitalize">{deal.title}</p>
        <p className="mt-0.5 truncate text-xs text-white/70">{deal.profile?.displayName}</p>
        <button
          type="button"
          onClick={dealOrder.order}
          disabled={dealOrder.busy}
          className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-grape-700 shadow-lg transition hover:scale-[1.03] disabled:opacity-60"
        >
          {dealOrder.label}
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 w-[48%] sm:w-[44%]">
        <SmartImage src={image} alt={food?.name || deal.title} hint={food?.name || deal.title} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#6d28d9] via-[#6d28d9]/55 to-transparent" />
      </div>
      <div className="pointer-events-none absolute -top-10 -left-8 h-32 w-32 rounded-full bg-white/10" />
    </div>
  );
}
