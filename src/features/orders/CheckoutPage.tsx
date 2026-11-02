"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LuBanknote, LuBike, LuCheck, LuMapPin, LuShoppingBag } from "react-icons/lu";

import { Button, ButtonLink, EmptyState, Field, Input, PageHeading, PageLoader, TextArea } from "@/components/ui";
import { CART_KEY, useCart } from "@/hooks/useCart";
import { getErrorMessage } from "@/services/api";
import { accountApi, orderApi } from "@/services/foodmart";
import { cn, formatPKR } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { CITIES, useLocationStore } from "@/store/locationStore";
import { TotalsBox } from "./CartPage";

/* =========================================================
   CHECKOUT
   POST /orders { fulfillmentType, paymentMethod, addressId |
   deliveryAddress, contactPhone, notes } + Idempotency-Key.
   Totals are always recalculated by the server.
========================================================= */

const newKey = () => `chk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export default function CheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { user, ready } = useAuthStore();
  const city = useLocationStore((s) => s.city);
  const cart = useCart();
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: accountApi.addresses, enabled: Boolean(user) });
  const c = cart.data;
  const deliveryAvailable = Boolean(c?.fulfillmentOptions?.delivery && c?.totals?.delivery);
  const pickupAvailable = Boolean(c?.fulfillmentOptions?.pickup && c?.totals?.pickup);
  const [mode, setMode] = useState<"DELIVERY" | "PICKUP">(params.get("mode") === "pickup" ? "PICKUP" : "DELIVERY");
  const [addressId, setAddressId] = useState<string>("");
  const [newAddress, setNewAddress] = useState({ line1: "", area: "", city, phone: "" });
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const key = useRef(newKey());

  useEffect(() => {
    if (c && !deliveryAvailable && pickupAvailable) setMode("PICKUP");
    if (c && deliveryAvailable && !pickupAvailable) setMode("DELIVERY");
  }, [c, deliveryAvailable, pickupAvailable]);
  useEffect(() => {
    const def = addresses.data?.find((a) => a.isDefault) || addresses.data?.[0];
    if (def && !addressId) setAddressId(def._id);
  }, [addresses.data, addressId]);
  useEffect(() => {
    if (user?.phone && !phone) setPhone(user.phone);
  }, [user, phone]);

  const totals = useMemo(() => (mode === "DELIVERY" ? c?.totals?.delivery : c?.totals?.pickup), [mode, c]);
  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/checkout");
  }, [ready, user, router]);

  if (!ready || !user || cart.isLoading) return <PageLoader />;
  if (!c?.items.length) return <div className="container-fm py-10"><EmptyState icon={<LuShoppingBag />} title="Your cart is empty" action={<ButtonLink href="/explore">Explore food</ButtonLink>} /></div>;

  const place = async () => {
    if (mode === "DELIVERY" && addressId === "new" && (newAddress.line1.trim().length < 3 || !newAddress.city)) {
      toast.error("Add your delivery address.");
      return;
    }
    setPlacing(true);
    try {
      const body: Record<string, unknown> = {
        fulfillmentType: mode,
        paymentMethod: mode === "DELIVERY" ? "CASH_ON_DELIVERY" : "CASH_ON_PICKUP",
        contactPhone: phone || undefined,
        notes: notes || undefined,
      };
      if (mode === "DELIVERY") {
        if (addressId && addressId !== "new") body.addressId = addressId;
        else body.deliveryAddress = { line1: [newAddress.line1, newAddress.area].filter(Boolean).join(", "), city: newAddress.city, phone: newAddress.phone || phone || undefined };
      }
      const order = await orderApi.checkout(body, key.current);
      qc.setQueryData(CART_KEY, { ...c, items: [], totals: null, canCheckout: false });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed! The restaurant will confirm shortly.");
      router.replace(`/orders/${order._id}?placed=1`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      key.current = newKey();
    } finally {
      setPlacing(false);
    }
  };

  const option = (value: "DELIVERY" | "PICKUP", label: string, sub: string, Icon: typeof LuBike, available: boolean) => (
    <button
      type="button"
      disabled={!available}
      onClick={() => setMode(value)}
      className={cn("flex flex-1 items-center gap-3 rounded-2xl border p-4 text-left transition disabled:opacity-40", mode === value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200")}
    >
      <Icon className="text-2xl text-brand-500" />
      <span>
        <b className="block text-sm text-navy-900">{label}</b>
        <span className="text-xs text-ink-500">{available ? sub : "Not offered by this seller"}</span>
      </span>
    </button>
  );

  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading title="Checkout" subtitle={`Ordering from ${c.seller?.displayName || "this seller"}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-3 font-bold text-navy-900">1. How do you want it?</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              {option("DELIVERY", "Delivery", c.totals?.delivery?.deliveryFee ? `Fee ${formatPKR(c.totals.delivery.deliveryFee)}` : "To your address", LuBike, deliveryAvailable)}
              {option("PICKUP", "Pickup", "Collect from the restaurant", LuShoppingBag, pickupAvailable)}
            </div>
          </section>

          {mode === "DELIVERY" && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-navy-900">2. Delivery address</h2>
              <div className="space-y-2">
                {(addresses.data || []).map((a) => (
                  <label key={a._id} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-3", addressId === a._id ? "border-brand-400 bg-brand-50" : "border-ink-200")}>
                    <input type="radio" className="mt-1 accent-[#ff6b1a]" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
                    <span className="text-sm">
                      <b className="text-navy-900">{a.label || "Address"}</b>
                      <span className="block text-ink-600">{[a.line1, a.area, a.city].filter(Boolean).join(", ")}</span>
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3", addressId === "new" || !addresses.data?.length ? "border-brand-400 bg-brand-50" : "border-ink-200")}>
                  <input type="radio" className="accent-[#ff6b1a]" checked={addressId === "new" || !addresses.data?.length} onChange={() => setAddressId("new")} />
                  <span className="flex items-center gap-1 text-sm font-semibold text-navy-900">
                    <LuMapPin /> Deliver to a new address
                  </span>
                </label>
                {(addressId === "new" || !addresses.data?.length) && (
                  <div className="grid gap-3 pt-2 sm:grid-cols-2">
                    <Field label="House / street" className="sm:col-span-2">
                      <Input value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} placeholder="House 12, Street 4" />
                    </Field>
                    <Field label="Area">
                      <Input value={newAddress.area} onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })} placeholder="DHA Phase 6" />
                    </Field>
                    <Field label="City">
                      <select value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="field">
                        {CITIES.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-navy-900">{mode === "DELIVERY" ? "3." : "2."} Contact & payment</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone number">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" />
              </Field>
              <div className="flex items-center gap-3 rounded-2xl border border-success-100 bg-success-50 p-3 text-sm text-success-600">
                <LuBanknote className="text-2xl" />
                <span>
                  <b className="block">{mode === "DELIVERY" ? "Cash on delivery" : "Cash on pickup"}</b>
                  <span className="text-xs">Online payments are coming soon</span>
                </span>
              </div>
              <Field label="Notes for the kitchen (optional)" className="sm:col-span-2">
                <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Less spicy please, ring the bell..." className="min-h-20" />
              </Field>
            </div>
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-32">
          <h2 className="font-bold text-navy-900">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {c.items
              .filter((i) => i.available)
              .map((i) => (
                <li key={i.foodId} className="flex justify-between gap-3">
                  <span className="truncate text-ink-700">
                    {i.quantity} × {i.name}
                  </span>
                  <span className="shrink-0 text-ink-800">{formatPKR(i.lineTotal)}</span>
                </li>
              ))}
          </ul>
          <TotalsBox totals={totals} label={mode === "PICKUP" ? "pickup" : "delivery"} />
          {c.issues.length > 0 && <p className="rounded-xl bg-warning-50 p-2 text-xs text-warning-600">{c.issues[0].message}</p>}
          <Button size="lg" className="w-full" icon={<LuCheck />} loading={placing} disabled={!c.canCheckout || !totals} onClick={place}>
            Place order · {formatPKR(totals?.grandTotal)}
          </Button>
        </aside>
      </div>
    </div>
  );
}
