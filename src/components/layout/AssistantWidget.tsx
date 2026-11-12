"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { LuSend, LuSparkles, LuX } from "react-icons/lu";

import { LogoMark } from "@/components/brand/Logo";
import { Spinner } from "@/components/ui";
import { cn, formatPKR } from "@/lib/utils";
import { getErrorMessage } from "@/services/api";
import { agentApi } from "@/services/foodmart";
import { partnerProfiles, useAuthStore } from "@/store/authStore";
import { usePrefs } from "@/store/prefsStore";

/* =========================================================
   FOODMART ASSISTANT (floating chat, signed-in customers)
   POST /agents/chat - read-only assistant: food ideas, order
   status, budget picks. Never places or changes orders.
========================================================= */

interface Msg {
  role: "user" | "assistant";
  text: string;
  items?: { id?: string; name: string; price?: number; seller?: { name?: string } | string; availableNow?: boolean }[];
  smart?: boolean;
}

/* Meal that fits the hour (device time) so the first buttons feel relevant. */
const mealForHour = (hour: number) => (hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 19 ? "snack" : "dinner");

const startersFor = (hour: number, isSeller: boolean) => {
  const meal = mealForHour(hour);
  const list = [`Show my ${meal} favourites`, `Suggest ${meal} under 800`, "Where is my last order?", "Try something new"];
  return isSeller ? ["How are my sales?", "Show my open orders", ...list.slice(0, 2)] : list;
};

/* Buttons shown under an answer, based on what it was about. */
const followUps = (reply: Msg, isSeller: boolean) => {
  if (reply.items?.length) return ["Something cheaper", "Try something new"];
  if (/favourite/i.test(reply.text)) return ["Suggest something under 800", "Where is my last order?"];
  if (/order/i.test(reply.text)) return ["Show my favourites", "Try something new"];
  return isSeller ? ["How are my sales?", "Show my open orders"] : ["Show my favourites", "Suggest something under 500"];
};

export function AssistantWidget() {
  const pathname = usePathname() || "/";
  const user = useAuthStore((s) => s.user);
  const lang = usePrefs((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [hour, setHour] = useState(12);
  const endRef = useRef<HTMLDivElement>(null);
  const isSeller = partnerProfiles(useAuthStore((s) => s.profiles) || []).length > 0;
  /* "smart" = Claude is answering, "basic" = the built-in rules (no API key / no credits) */
  const status = useQuery({ queryKey: ["assistant-status"], queryFn: agentApi.status, enabled: open && !!user, staleTime: 60_000, retry: false });

  useEffect(() => {
    setMounted(true);
    setHour(new Date().getHours());
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* keep the screen clean on full-screen / checkout style pages */
  if (!mounted || !user || pathname.startsWith("/reels") || pathname.startsWith("/checkout") || pathname.startsWith("/login") || pathname.startsWith("/signup")) return null;

  const send = async (message: string) => {
    const content = message.trim();
    if (!content || sending) return;
    setMessages((m) => [...m, { role: "user", text: content }]);
    setText("");
    setSending(true);
    try {
      const res = await agentApi.chat({ message: content, conversationId, language: lang });
      setConversationId(res.conversationId);
      const items = Array.isArray(res.suggestions?.items) ? res.suggestions.items.slice(0, 4) : undefined;
      setMessages((m) => [...m, { role: "assistant", text: res.reply, items, smart: res.provider === "anthropic" }]);
      setNote(`${res.usage.remaining} of ${res.usage.limit} messages left today`);
    } catch (error) {
      setMessages((m) => [...m, { role: "assistant", text: getErrorMessage(error) }]);
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask FoodMart Assistant"
          className="fixed end-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-ink-100 bg-white shadow-pop transition hover:scale-105 md:bottom-6 md:h-16 md:w-16"
        >
          <LogoMark size={30} />
          <span className="brand-gradient absolute -top-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white">
            <LuSparkles />
          </span>
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[85] flex items-end justify-end sm:p-5 ltr:sm:justify-end rtl:sm:justify-start" role="dialog" aria-label="FoodMart Assistant">
          <div className="absolute inset-0 bg-night-950/40 sm:bg-transparent" onClick={() => setOpen(false)} />
          <div className="animate-fade-up relative flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop sm:h-[560px] sm:max-w-[380px] sm:rounded-3xl">
            <div className="brand-gradient flex items-center justify-between px-4 py-3 text-white">
              <div className="flex items-center gap-2 font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  <LogoMark size={22} />
                </span>
                <span className="leading-tight">
                  FoodMart Assistant
                  {status.data?.enabled && (
                    <span className="block text-[10px] font-medium text-white/85">
                      {status.data.provider === "anthropic" ? "Smart mode" : "Basic mode: I understand simple questions"}
                    </span>
                  )}
                </span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20">
                <LuX className="text-xl" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
              {messages.length === 0 && (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-ink-600">Hi {user.name.split(" ")[0]}! Ask me for food ideas, your favourites, or the status of your order.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {startersFor(hour, isSeller).map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-700 hover:border-brand-300 hover:bg-brand-50">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" && "justify-end")}>
                  <div className="max-w-[88%] space-y-2">
                    <div className={cn("rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line", m.role === "user" ? "brand-gradient text-white" : "bg-ink-50 text-ink-800")}>{m.text}</div>
                    {m.items?.map((it, k) => (
                      <Link key={it.id || k} href={it.id ? `/food/${it.id}` : "/explore"} onClick={() => setOpen(false)} className="block rounded-xl border border-ink-100 bg-white p-2.5 text-xs hover:border-brand-300">
                        <b className="block truncate text-navy-900">{it.name}</b>
                        <span className="text-ink-500">{typeof it.seller === "object" ? it.seller?.name : it.seller}</span>
                        {it.price != null && <b className="ml-2 text-brand-600">{formatPKR(it.price)}</b>}
                        {it.availableNow !== undefined && (
                          <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", it.availableNow ? "bg-success-50 text-success-600" : "bg-ink-100 text-ink-500")}>
                            {it.availableNow ? "Available now" : "Not now"}
                          </span>
                        )}
                      </Link>
                    ))}
                    {m.role === "assistant" && i === messages.length - 1 && !sending && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {followUps(m, isSeller).map((f) => (
                          <button key={f} onClick={() => send(f)} className="rounded-full border border-ink-200 px-2.5 py-1 text-[11px] text-ink-600 hover:border-brand-300 hover:bg-brand-50">
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Spinner /> Thinking...
                </div>
              )}
              <div ref={endRef} />
            </div>
            {note && <p className="px-4 pb-1 text-center text-[11px] text-ink-400">{note}</p>}
            <form
              className="flex items-center gap-2 border-t border-ink-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void send(text);
              }}
            >
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={800} placeholder="Type your question..." aria-label="Message" className="field h-11 flex-1" />
              <button type="submit" disabled={!text.trim() || sending} className="brand-gradient flex h-11 w-11 items-center justify-center rounded-full text-white disabled:opacity-50" aria-label="Send">
                <LuSend />
              </button>
            </form>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
