"use client";

import { PaymentPanel } from "./PaymentPanel";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LuCheck, LuChefHat, LuCircleCheck, LuClipboardCheck, LuPackageCheck, LuPhone, LuReceipt, LuStar, LuX } from "react-icons/lu";

import { RequireAuth } from "@/components/layout/RequireAuth";
import { Avatar, Button, ButtonLink, EmptyState, ErrorState, Modal, OrderStatusBadge, PageHeading, PageLoader, Skeleton, Stars, Tabs, TextArea } from "@/components/ui";
import { getErrorMessage } from "@/services/api";
import { orderApi, reviewApi } from "@/services/foodmart";
import { cn, formatDateTime, formatPKR, profilePath, titleCase } from "@/lib/utils";
import type { Order, Profile } from "@/lib/types";

/* =========================================================
   MY ORDERS + ORDER TRACKING
   Backend: GET /orders, GET /orders/:id (statusHistory +
   reviewEligibility), POST /orders/:id/cancel,
   POST /food-reviews, /restaurant-reviews, /seller-reviews
========================================================= */

const ACTIVE = ["PENDING", "ACCEPTED", "PREPARING", "READY"];
const STEPS = [
  { status: "PENDING", label: "Placed", icon: LuReceipt },
  { status: "ACCEPTED", label: "Confirmed", icon: LuClipboardCheck },
  { status: "PREPARING", label: "Preparing", icon: LuChefHat },
  { status: "READY", label: "Ready", icon: LuPackageCheck },
  { status: "COMPLETED", label: "Delivered", icon: LuCircleCheck },
];

const sellerOf = (o: Order) => (typeof o.seller === "object" ? (o.seller as Partial<Profile>) : null);

function OrdersList() {
  const [tab, setTab] = useState<"active" | "past">("active");
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => orderApi.list({ limit: 50 }) });
  const list = (orders.data?.items || []).filter((o) => (tab === "active" ? ACTIVE.includes(o.status) : !ACTIVE.includes(o.status)));
  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading title="My orders" subtitle="Track live orders and review past ones." actions={<Tabs value={tab} onChange={setTab} tabs={[{ value: "active", label: "Active" }, { value: "past", label: "Past" }]} />} />
      {orders.isError ? (
        <ErrorState message={getErrorMessage(orders.error)} onRetry={() => orders.refetch()} />
      ) : orders.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !list.length ? (
        <EmptyState icon={<LuReceipt />} title={tab === "active" ? "No active orders" : "No past orders yet"} action={<ButtonLink href="/explore">Order something tasty</ButtonLink>} />
      ) : (
        <div className="space-y-3">
          {list.map((o) => {
            const seller = sellerOf(o);
            return (
              <Link key={o._id} href={`/orders/${o._id}`} className="card flex items-center gap-4 p-4 transition hover:border-brand-200">
                <Avatar src={seller?.avatar?.url} name={seller?.displayName || o.sellerNameSnapshot} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-900">{seller?.displayName || o.sellerNameSnapshot}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="truncate text-xs text-ink-500">
                    #{o.orderNumber.split("-").pop()} · {o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ")}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    {formatDateTime(o.createdAt)} · {titleCase(o.fulfillmentType)}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-navy-900">{formatPKR(o.grandTotal)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewModal({ order, target, onClose, onDone }: { order: Order; target: { kind: "FOOD"; orderItemId: string; name: string } | { kind: "RESTAURANT" | "SELLER"; name: string }; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      if (target.kind === "FOOD") await reviewApi.createFood({ orderId: order._id, orderItemId: target.orderItemId, rating, text: text || undefined });
      else await reviewApi.createService(target.kind, { orderId: order._id, rating, text: text || undefined });
      toast.success("Thanks for your review!");
      onDone();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Review ${target.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={submit}>
            Submit review
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-center">
        <Stars value={rating} size="text-3xl" onChange={setRating} />
        <TextArea value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you like? Anything to improve?" />
        <p className="text-xs text-ink-400">Reviews are tied to this verified order.</p>
      </div>
    </Modal>
  );
}

function OrderDetail({ id }: { id: string }) {
  const params = useSearchParams();
  const q = useQuery({ queryKey: ["order", id], queryFn: () => orderApi.get(id) });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Parameters<typeof ReviewModal>[0]["target"] | null>(null);
  const o = q.data;

  if (q.isLoading) return <PageLoader />;
  if (q.isError || !o) return <div className="container-fm py-10"><ErrorState message={getErrorMessage(q.error, "Order not found.")} onRetry={() => q.refetch()} /></div>;

  const seller = sellerOf(o);
  const failed = o.status === "CANCELLED" || o.status === "REJECTED";
  const reached = new Set(o.statusHistory?.map((h) => h.to));
  const stepIndex = STEPS.findIndex((s) => s.status === o.status);
  const ended = o.statusHistory?.find((h) => h.to === o.status);

  const cancel = async () => {
    setBusy(true);
    try {
      await orderApi.cancel(o._id, reason || undefined);
      toast.success("Order cancelled");
      setCancelOpen(false);
      q.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-fm py-6 sm:py-8">
      {params.get("placed") && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-success-50 p-4 text-sm text-success-600">
          <LuCheck className="text-xl" /> Order placed! You&apos;ll get a notification when {seller?.displayName || "the restaurant"} confirms it.
        </div>
      )}
      <PageHeading
        title={`Order #${o.orderNumber.split("-").pop()}`}
        subtitle={`${formatDateTime(o.createdAt)} · ${titleCase(o.fulfillmentType)} · ${o.paymentMethod.replace(/_/g, " ").toLowerCase()}`}
        actions={<OrderStatusBadge status={o.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card p-5">
            {failed ? (
              <div className="flex items-center gap-3 text-danger-600">
                <LuX className="text-2xl" />
                <div>
                  <p className="font-semibold">Order {o.status.toLowerCase()}</p>
                  <p className="text-sm text-ink-600">{ended?.reason || o.cancelReason || o.rejectionReason || ""}</p>
                </div>
              </div>
            ) : (
              <ol className="grid grid-cols-5 gap-1">
                {STEPS.map((s, i) => {
                  const done = reached.has(s.status) || i <= stepIndex;
                  const at = o.statusHistory?.find((h) => h.to === s.status)?.at;
                  return (
                    <li key={s.status} className="flex flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <span className={cn("h-1 flex-1 rounded-full", i === 0 ? "opacity-0" : done ? "bg-brand-500" : "bg-ink-100")} />
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg", done ? "brand-gradient text-white shadow-glow" : "bg-ink-100 text-ink-400")}>
                          <s.icon />
                        </span>
                        <span className={cn("h-1 flex-1 rounded-full", i === STEPS.length - 1 ? "opacity-0" : i < stepIndex ? "bg-brand-500" : "bg-ink-100")} />
                      </div>
                      <p className={cn("mt-2 text-[11px] font-semibold sm:text-xs", done ? "text-navy-900" : "text-ink-400")}>{s.status === "COMPLETED" && o.fulfillmentType === "PICKUP" ? "Picked up" : s.label}</p>
                      {at && <p className="text-[10px] text-ink-400">{new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
            {ACTIVE.includes(o.status) && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-50 p-3 text-sm text-ink-600">
                <span>We refresh this page automatically. You&apos;ll also get notifications.</span>
                {["PENDING", "ACCEPTED"].includes(o.status) && (
                  <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
                    Cancel order
                  </Button>
                )}
              </div>
            )}
          </section>

          {!failed && <PaymentPanel orderId={o._id} returned={params.get("payment") === "success"} />}
          {failed && o.paymentStatus === "PAID" && <PaymentPanel orderId={o._id} />}

          {o.reviewEligibility && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-navy-900">Rate your order</h2>
              <div className="space-y-2">
                {o.reviewEligibility.foodItems.map((item) => (
                  <div key={item.orderItemId} className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 p-3">
                    <span className="text-sm font-medium text-ink-800">{item.name}</span>
                    {item.reviewed ? (
                      <span className="text-xs font-semibold text-success-600">Reviewed ✓</span>
                    ) : (
                      <Button size="sm" variant="soft" icon={<LuStar />} onClick={() => setReview({ kind: "FOOD", orderItemId: item.orderItemId, name: item.name })}>
                        Rate dish
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 p-3">
                  <span className="text-sm font-medium text-ink-800">{seller?.displayName || o.sellerNameSnapshot} service</span>
                  {o.reviewEligibility.service.reviewed ? (
                    <span className="text-xs font-semibold text-success-600">Reviewed ✓</span>
                  ) : (
                    <Button size="sm" variant="soft" icon={<LuStar />} onClick={() => setReview({ kind: o.reviewEligibility!.service.reviewType, name: seller?.displayName || "Seller" })}>
                      Rate service
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="card h-fit space-y-4 p-5">
          {seller && (
            <Link href={profilePath(seller as Profile)} className="flex items-center gap-3 border-b border-ink-100 pb-4">
              <Avatar src={seller.avatar?.url} name={seller.displayName} size={44} />
              <div>
                <p className="font-semibold text-navy-900">{seller.displayName}</p>
                <p className="text-xs text-ink-500">View restaurant</p>
              </div>
            </Link>
          )}
          <ul className="space-y-2 text-sm">
            {o.items.map((i) => (
              <li key={i._id} className="flex justify-between gap-3">
                <span className="text-ink-700">
                  {i.quantity} × {i.nameSnapshot}
                </span>
                <span className="text-ink-800">{formatPKR(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-ink-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatPKR(o.subtotal)}</span>
            </div>
            {o.discountTotal > 0 && (
              <div className="flex justify-between text-success-600">
                <span>Discount</span>
                <span>- {formatPKR(o.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-600">
              <span>Delivery</span>
              <span>{o.deliveryFee ? formatPKR(o.deliveryFee) : "Free"}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold text-navy-900">
              <span>Total</span>
              <span>{formatPKR(o.grandTotal)}</span>
            </div>
          </div>
          {o.deliveryAddress?.line1 && (
            <p className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
              Deliver to: {[o.deliveryAddress.line1, o.deliveryAddress.city].filter(Boolean).join(", ")}
            </p>
          )}
          {o.contactPhone && (
            <p className="flex items-center gap-2 text-xs text-ink-500">
              <LuPhone /> {o.contactPhone}
            </p>
          )}
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button variant="danger" loading={busy} onClick={cancel}>
              Cancel order
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-600">You can cancel before the restaurant accepts, or within a few minutes after.</p>
        <TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="min-h-20" />
      </Modal>
      {review && (
        <ReviewModal
          order={o}
          target={review}
          onClose={() => setReview(null)}
          onDone={() => {
            setReview(null);
            q.refetch();
          }}
        />
      )}
      {ACTIVE.includes(o.status) && <AutoRefresh onTick={() => q.refetch()} />}
    </div>
  );
}

/* Poll live orders every 20 s (status changes come from the restaurant) */
function AutoRefresh({ onTick }: { onTick: () => void }) {
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });
  useEffect(() => {
    const timer = window.setInterval(() => tick.current(), 20000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}

export function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersList />
    </RequireAuth>
  );
}

export function OrderPage({ id }: { id: string }) {
  return (
    <RequireAuth>
      <OrderDetail id={id} />
    </RequireAuth>
  );
}
