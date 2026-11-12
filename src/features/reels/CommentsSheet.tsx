"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { LuChevronDown, LuMessageCircle, LuSend, LuX } from "react-icons/lu";

import { Avatar, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getErrorMessage } from "@/services/api";
import { socialApi } from "@/services/foodmart";
import { useAuthStore } from "@/store/authStore";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import type { Post } from "@/lib/types";

/* =========================================================
   COMMENTS - TikTok / Instagram style
   Phones: bottom sheet. Desktop: side panel next to the reel.
   Replies are one level deep (backend: parentId, replyCount).
========================================================= */

type Reply = { id: string; name: string };

const nameOf = (c: any) => c.actingProfile?.displayName || c.user?.name || "Foodie";
const avatarOf = (c: any) => c.actingProfile?.avatar?.url || c.user?.avatar?.url;

function CommentRow({ c, postId, onReply, small = false }: { c: any; postId: string; onReply: (r: Reply) => void; small?: boolean }) {
  const [showReplies, setShowReplies] = useState(false);
  const replies = useQuery({ queryKey: ["comment-replies", c._id], queryFn: () => socialApi.comments(postId, c._id), enabled: showReplies });
  return (
    <li className="flex gap-3">
      <Avatar src={avatarOf(c)} name={nameOf(c)} size={small ? 28 : 36} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-500">{nameOf(c)}</p>
        <p className="mt-0.5 text-[14px] leading-snug break-words text-ink-900">{c.body}</p>
        <div className="mt-1 flex items-center gap-4 text-xs text-ink-400">
          <span>{timeAgo(c.createdAt)}</span>
          {!small && (
            <button onClick={() => onReply({ id: c._id, name: nameOf(c) })} className="font-semibold hover:text-ink-700">
              Reply
            </button>
          )}
        </div>
        {!small && c.replyCount > 0 && (
          <button onClick={() => setShowReplies((v) => !v)} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <span className="h-px w-6 bg-ink-300" />
            {showReplies ? "Hide replies" : `View ${c.replyCount} ${c.replyCount === 1 ? "reply" : "replies"}`}
            <LuChevronDown className={cn("transition", showReplies && "rotate-180")} />
          </button>
        )}
        {showReplies && (
          <ul className="mt-3 space-y-3">
            {replies.isLoading ? (
              <li className="py-1">
                <Spinner />
              </li>
            ) : (
              (replies.data?.items || []).map((r: any) => <CommentRow key={r._id} c={r} postId={postId} onReply={onReply} small />)
            )}
          </ul>
        )}
      </div>
    </li>
  );
}

export function CommentsSheet({ post, open, onClose }: { post: Post; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const ensureAuth = useRequireAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Reply | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useQuery({ queryKey: ["comments", post._id], queryFn: () => socialApi.comments(post._id), enabled: open });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const startReply = (r: Reply) => {
    setReplyTo(r);
    input.current?.focus();
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending || !ensureAuth("Sign in to comment")) return;
    setSending(true);
    try {
      await socialApi.comment(post._id, body, replyTo?.id);
      setText("");
      if (replyTo) await qc.invalidateQueries({ queryKey: ["comment-replies", replyTo.id] });
      await qc.invalidateQueries({ queryKey: ["comments", post._id] });
      setReplyTo(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const total = (post.stats.comments || 0) + 0;
  const items = list.data?.items || [];

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" onClick={onClose} />
      <section
        role="dialog"
        aria-label="Comments"
        className="animate-fade-up relative flex h-[72dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop md:h-full md:w-[420px] md:rounded-none md:rounded-l-3xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-200 md:hidden" />
        <header className="flex items-center justify-between px-5 py-3">
          <h3 className="mx-auto text-sm font-bold text-navy-900 md:mx-0 md:text-base">{formatCompact(Math.max(total, items.length))} comments</h3>
          <button onClick={onClose} className="absolute top-3 right-4 rounded-full p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Close comments">
            <LuX className="text-xl" />
          </button>
        </header>

        <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain border-t border-ink-100 px-5 py-4">
          {list.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="text-2xl" />
            </div>
          ) : list.isError ? (
            <div className="py-10 text-center text-sm text-ink-500">
              Could not load comments.{" "}
              <button onClick={() => list.refetch()} className="font-semibold text-brand-600">
                Try again
              </button>
            </div>
          ) : !items.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-2xl text-ink-400">
                <LuMessageCircle />
              </span>
              <p className="font-semibold text-ink-800">No comments yet</p>
              <p className="mt-1 text-sm text-ink-500">Start the conversation.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((c: any) => (
                <CommentRow key={c._id} c={c} postId={post._id} onReply={startReply} />
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-ink-100 bg-white px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5 text-xs text-ink-600">
              <span>
                Replying to <b>{replyTo.name}</b>
              </span>
              <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="text-ink-400 hover:text-ink-700">
                <LuX />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Avatar src={user?.avatar?.url} name={user?.name || "You"} size={34} />
            <input
              ref={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              maxLength={1000}
              placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Add comment..."}
              className="h-10 min-w-0 flex-1 rounded-full bg-ink-100 px-4 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:bg-ink-50 focus:ring-2 focus:ring-brand-200"
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              aria-label="Post comment"
              className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition", text.trim() ? "brand-gradient text-white shadow-glow" : "bg-ink-100 text-ink-400")}
            >
              {sending ? <Spinner className="text-lg !text-white" /> : <LuSend />}
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body
  );
}
