"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuMinus, LuPlus, LuShoppingBag, LuTicketPercent, LuTrash2, LuTriangleAlert } from "react-icons/lu";

import { Avatar, Button, ButtonLink, EmptyState, ErrorState, PageHeading, PageLoader, Tabs } from "@/components/ui";
import { SmartImage } from "@/components/ui/SmartImage";
import { useCart, useUpdateCart } from "@/hooks/useCart";
import { getErrorMessage } from "@/services/api";
import { formatPKR, profilePath, PROFILE_TYPE_LABEL } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { CartTotals } from "@/lib/types";

/* =========================================================
   CART (one seller per cart, totals & deals from the server)
========================================================= */

export function TotalsBox({ totals, label }: { totals: CartTotals | null | undefined; label?: string }) {
  if (!totals) return null;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-ink-600">
        <span>Subtotal</span>
        <span>{formatPKR(totals.subtotal)}</span>
      </div>
      {totals.discountTotal > 0 && (
        <div className="flex justify-between text-success-600">
          <span className="flex items-center gap-1">
            <LuTicketPercent /> {totals.deal?.title || "Deal"}
          </span>
          <span>- {formatPKR(totals.discountTotal)}</span>
        </div>
      )}
      <div className="flex justify-between text-ink-600">
        <span>Delivery fee</span>
        <span>{totals.deliveryFee ? formatPKR(totals.deliveryFee) : label === "pickup" ? "Pickup - free" : "Free"}</span>
      </div>
      <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold text-navy-900">
        <span>Total</span>
        <span>{formatPKR(totals.grandTotal)}</span>
      </div>
    </div>
  );
}

export default function CartPage() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const cart = useCart();
  const update = useUpdateCart();
  const router = useRouter();
  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");

  if (!ready) return <PageLoader />;
  if (!user)
    return (
      <div className="container-fm py-10">
        <EmptyState icon={<LuShoppingBag />} title="Sign in to see your cart" action={<ButtonLink href="/login?next=/cart">Sign In</ButtonLink>} />
      </div>
    );
  if (cart.isLoading) return <PageLoader />;
  if (cart.isError) return <div className="container-fm py-10"><ErrorState message={getErrorMessage(cart.error)} onRetry={() => cart.refetch()} /></div>;
  const c = cart.data;
  if (!c?.items.length)
    return (
      <div className="container-fm py-10">
        <EmptyState icon={<LuShoppingBag />} title="Your cart is empty" text="Find something delicious and add it here." action={<ButtonLink href="/explore">Explore food</ButtonLink>} />
      </div>
    );

  const delivery = c.fulfillmentOptions?.delivery && c.totals?.delivery;
  const activeMode = delivery ? mode : "pickup";
  const totals = activeMode === "delivery" ? c.totals?.delivery : c.totals?.pickup;

  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading title="Your cart" subtitle="Prices, deals and delivery fees are calculated by the restaurant's live settings." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card p-4 sm:p-5">
          {c.seller && (
            <Link href={profilePath(c.seller)} className="mb-4 flex items-center gap-3 border-b border-ink-100 pb-4">
              <Avatar src={c.seller.avatar?.url} name={c.seller.displayName} size={44} />
              <div>
                <p className="font-semibold text-navy-900">{c.seller.displayName}</p>
                <p className="text-xs text-ink-500">{PROFILE_TYPE_LABEL[c.seller.profileType || "RESTAURANT"]}</p>
              </div>
            </Link>
          )}
          {c.issues.length > 0 && (
            <div className="mb-4 space-y-1 rounded-2xl bg-warning-50 p-3 text-sm text-warning-600">
              {c.issues.map((i, k) => (
                <p key={k} className="flex items-start gap-2">
                  <LuTriangleAlert className="mt-0.5 shrink-0" /> {i.message}
                </p>
              ))}
            </div>
          )}
          <ul className="divide-y divide-ink-100">
            {c.items.map((item) => (
              <li key={item.foodId} className="flex items-center gap-3 py-3">
                <SmartImage src={item.image} alt={item.name || "Item"} className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <Link href={`/food/${item.foodId}`} className="block truncate font-semibold text-navy-900 hover:text-brand-600">
                    {item.name || "Unavailable item"}
                  </Link>
                  <p className="text-xs text-ink-500">{formatPKR(item.unitPrice)} each</p>
                  {!item.available && <p className="text-xs font-semibold text-danger-500">Not available right now</p>}
                </div>
                <div className="flex items-center rounded-full border border-ink-200">
                  <button onClick={() => update.mutate({ foodId: item.foodId, quantity: item.quantity - 1 })} className="flex h-9 w-9 items-center justify-center text-ink-600" aria-label="Less">
                    {item.quantity === 1 ? <LuTrash2 className="text-danger-500" /> : <LuMinus />}
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => update.mutate({ foodId: item.foodId, quantity: item.quantity + 1 })} className="flex h-9 w-9 items-center justify-center text-ink-600" aria-label="More">
                    <LuPlus />
                  </button>
                </div>
                <p className="hidden w-24 text-right font-semibold text-navy-900 sm:block">{formatPKR(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </div>
        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-32">
          {delivery && c.fulfillmentOptions?.pickup ? (
            <Tabs
              value={activeMode}
              onChange={setMode}
              className="w-full"
              tabs={[
                { value: "delivery", label: "Delivery" },
                { value: "pickup", label: "Pickup" },
              ]}
            />
          ) : (
            <p className="text-sm font-semibold text-navy-900">{delivery ? "Delivery only" : "Pickup only"}</p>
          )}
          <TotalsBox totals={totals} label={activeMode} />
          <Button size="lg" className="w-full" disabled={!c.canCheckout} onClick={() => router.push(`/checkout?mode=${activeMode}`)}>
            Checkout · {formatPKR(totals?.grandTotal)}
          </Button>
          <p className="text-center text-[11px] text-ink-400">Pay cash on delivery or at pickup.</p>
        </aside>
      </div>
    </div>
  );
}
