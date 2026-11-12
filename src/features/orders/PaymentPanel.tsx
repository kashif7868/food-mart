"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LuCheck, LuCreditCard, LuRefreshCw, LuSmartphone } from "react-icons/lu";

import { Button, Field, Input } from "@/components/ui";
import { cn, formatPKR } from "@/lib/utils";
import { getErrorMessage } from "@/services/api";
import { paymentApi } from "@/services/foodmart";

/* =========================================================
   Payment section of the order page
   - cash: nothing to do online
   - card: Stripe Checkout (redirect) + "I already paid" refresh
   - JazzCash / Easypaisa: send money, then submit the transaction
     ID; the seller confirms it
========================================================= */

const label = (m: string) => m.replace(/_/g, " ").toLowerCase().replace(/^\w|\s\w/g, (c) => c.toUpperCase());

export function PaymentPanel({ orderId, returned, onPaid }: { orderId: string; returned?: boolean; onPaid?: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["order-payment", orderId], queryFn: () => paymentApi.forOrder(orderId), refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 15000 : false) });
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ reference: "", senderName: "", senderPhone: "" });
  const p = q.data;

  /* back from Stripe Checkout: confirm without waiting for the webhook */
  useEffect(() => {
    if (!returned) return;
    paymentApi
      .syncCard(orderId)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ["order-payment", orderId] });
        void qc.invalidateQueries({ queryKey: ["order", orderId] });
      })
      .catch(() => undefined);
  }, [returned, orderId, qc]);

  useEffect(() => {
    if (p?.status === "PAID") onPaid?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.status]);

  if (!p) return null;
  const isCash = p.method === "CASH_ON_DELIVERY" || p.method === "CASH_ON_PICKUP";
  const isCard = p.method === "CARD";
  const unpaid = p.status === "UNPAID" || p.status === "PENDING" || p.status === "FAILED";
  const proof = p.proof;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await q.refetch();
      void qc.invalidateQueries({ queryKey: ["order", orderId] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const payByCard = async () => {
    setBusy(true);
    try {
      const s = await paymentApi.startCard(orderId);
      window.location.href = s.url;
    } catch (error) {
      toast.error(getErrorMessage(error));
      setBusy(false);
    }
  };

  const tone = p.status === "PAID" ? "bg-success-50 text-success-600" : p.status === "FAILED" ? "bg-danger-50 text-danger-600" : "bg-warning-50 text-warning-600";

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold text-navy-900">
          {isCard ? <LuCreditCard /> : <LuSmartphone />} Payment · {label(p.method)}
        </h2>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone)}>{label(p.status)}</span>
      </div>
      <p className="text-sm text-ink-600">
        Amount: <b className="text-navy-900">{formatPKR(p.amount)}</b>
      </p>
      {p.failureReason && <p className="rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{p.failureReason}</p>}
      {p.refundStatus && p.refundStatus !== "NONE" && <p className="text-sm text-ink-600">Refund: {label(p.refundStatus)}{p.refundAmount ? ` · ${formatPKR(p.refundAmount)}` : ""}</p>}

      {isCash && p.status !== "PAID" && <p className="text-sm text-ink-500">Pay in cash when you {p.method === "CASH_ON_DELIVERY" ? "receive" : "pick up"} your order.</p>}

      {isCard && unpaid && (
        <div className="flex flex-wrap gap-2">
          <Button loading={busy} icon={<LuCreditCard />} onClick={payByCard}>
            Pay now
          </Button>
          <Button variant="outline" loading={busy} icon={<LuRefreshCw />} onClick={() => run(() => paymentApi.syncCard(orderId), "Payment status refreshed")}>
            I already paid
          </Button>
        </div>
      )}

      {!isCash && !isCard && p.status !== "PAID" && (
        <div className="space-y-3">
          {p.walletDestination && (
            <div className="rounded-2xl bg-brand-50 p-4 text-sm">
              <p className="text-ink-600">Send {formatPKR(p.amount)} to this {label(p.method)} account:</p>
              <p className="mt-1 text-xl font-extrabold tracking-wide text-navy-900">{p.walletDestination.number}</p>
              <p className="text-ink-600">{p.walletDestination.accountTitle}</p>
              <p className="mt-2 text-xs text-ink-500">Write your order number in the payment note. Then enter the transaction ID below.</p>
            </div>
          )}
          {proof?.status === "SUBMITTED" ? (
            <p className="flex items-center gap-2 rounded-xl bg-success-50 p-3 text-sm text-success-600">
              <LuCheck /> Transaction ID <b>{proof.reference}</b> sent. The seller will confirm it shortly.
            </p>
          ) : (
            <>
              {proof?.status === "REJECTED" && <p className="rounded-xl bg-danger-50 p-3 text-sm text-danger-600">The seller rejected your transaction ID: {proof.rejectReason}. Please send the correct one.</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Transaction ID" className="sm:col-span-2">
                  <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. 4829105738" maxLength={40} />
                </Field>
                <Field label="Sender name (optional)">
                  <Input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
                </Field>
                <Field label="Sender phone (optional)">
                  <Input value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} inputMode="tel" />
                </Field>
              </div>
              <Button
                loading={busy}
                disabled={form.reference.trim().length < 6}
                onClick={() => {
                  const body: { reference: string; senderName?: string; senderPhone?: string } = { reference: form.reference.trim() };
                  if (form.senderName.trim()) body.senderName = form.senderName.trim();
                  if (form.senderPhone.trim()) body.senderPhone = form.senderPhone.trim();
                  void run(() => paymentApi.submitProof(orderId, body), "Transaction ID submitted");
                }}
              >
                Submit transaction ID
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
