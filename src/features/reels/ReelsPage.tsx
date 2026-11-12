"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuBookmark, LuHeart, LuMessageCircle, LuPlay, LuRotateCw, LuShare2, LuShoppingBag, LuVolume2, LuVolumeX } from "react-icons/lu";

import { Avatar, Spinner } from "@/components/ui";
import { CommentsSheet } from "./CommentsSheet";
import { SmartImage } from "@/components/ui/SmartImage";
import { useFollow, useLike, useSavePost } from "@/hooks/useSocial";
import { useIsMine } from "@/hooks/useOwnership";
import { socialApi } from "@/services/foodmart";
import { cn, formatCompact, formatPKR, primaryImage, profilePath, PROFILE_TYPE_LABEL, timeAgo } from "@/lib/utils";
import type { Post } from "@/lib/types";

/* =========================================================
   REELS - vertical full-screen feed (30/45/60/90 s food reels)
   Backend: GET /reels/feed (cursor), GET /posts/:id, like/save,
   follow, POST /posts/:id/view (after 3 s), comments, share.
========================================================= */

function Action({ icon, label, onClick, active }: { icon: ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-white" aria-label={label}>
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-[22px] backdrop-blur transition hover:bg-black/50 md:bg-ink-100 md:text-ink-800 md:hover:bg-ink-200", active && "text-brand-500 md:text-brand-500")}>{icon}</span>
      <span className="text-[11px] font-semibold md:text-ink-700">{label}</span>
    </button>
  );
}

function ReelItem({ post, muted, onToggleMute }: { post: Post; muted: boolean; onToggleMute: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [near, setNear] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [comments, setComments] = useState(false);
  const like = useLike(post._id, Boolean(post.viewer?.liked));
  const save = useSavePost(post._id, Boolean(post.viewer?.saved));
  const follow = useFollow(post.author._id, false);
  const mine = useIsMine(post.author._id);
  const viewSent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    // start fetching the next/previous reel slightly before it scrolls in
    const pre = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "100% 0px 100% 0px" });
    pre.observe(el);
    return () => {
      io.disconnect();
      pre.disconnect();
    };
  }, []);

  /* the file's own address; a stored http:// link on an https site is blocked by the browser, so upgrade it */
  const videoUrl = (() => {
    const u = post.reel?.url;
    if (!u) return undefined;
    if (typeof window !== "undefined" && window.location.protocol === "https:" && u.startsWith("http://") && !/^http:\/\/(localhost|127\.)/.test(u)) return u.replace("http://", "https://");
    return u;
  })();

  const explain = (code?: number) => {
    if (videoUrl && /^https?:\/\/(localhost|127\.)/.test(videoUrl)) return "This video is saved on a local computer address, so other devices cannot reach it. Re-upload it after setting up cloud media storage.";
    if (code === 4) return "The video file is missing or its format is not supported by this browser.";
    if (code === 3) return "The video file looks damaged.";
    if (code === 2) return "The connection dropped while loading the video.";
    return "The video could not be loaded.";
  };

  const onVideoError = (v: HTMLVideoElement | null) => {
    if (!v) return;
    const code = v.error?.code ?? 4; // a failing <source> leaves error empty: treat as missing / unsupported
    console.error("[reels] video failed", { src: v.currentSrc, code, message: v.error?.message });
    setBuffering(false);
    setReason(explain(code));
    setFailed(true);
  };

  const retry = () => {
    const v = videoRef.current;
    if (!v) return;
    setFailed(false);
    setReason(null);
    setBuffering(true);
    v.load();
    v.play().catch(() => null);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (visible) {
      if (v && !paused) v.play().catch(() => null);
      const timer = setTimeout(() => {
        if (!viewSent.current) {
          viewSent.current = true;
          socialApi.view(post._id, Math.max(3, Math.round(v?.currentTime || 3))).catch(() => null);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
    v?.pause();
  }, [visible, paused, post._id]);

  const share = async () => {
    const url = `${window.location.origin}/reels?start=${post._id}`;
    socialApi.share(post._id).catch(() => null);
    try {
      if (navigator.share) await navigator.share({ title: post.caption || "FoodMart reel", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const likes = (post.stats.likes || 0) + (like.on === Boolean(post.viewer?.liked) ? 0 : like.on ? 1 : -1);
  const food = post.linkedFood;
  const thumb = post.reel?.thumbnailUrl || primaryImage(post.media);

  return (
    <div ref={ref} className="relative flex h-full snap-start snap-always items-center justify-center md:gap-5 md:py-4">
      <div className="relative h-full w-full overflow-hidden bg-black md:aspect-[9/16] md:h-full md:w-auto md:rounded-3xl md:shadow-pop">
        {post.reel?.url ? (
          <video
            ref={videoRef}
            poster={thumb || undefined}
            key={videoUrl}
            muted={muted}
            loop
            playsInline
            preload={visible ? "auto" : near ? "metadata" : "none"}
            className="absolute inset-0 h-full w-full object-cover"
            onClick={() => setPaused((p) => !p)}
            onLoadStart={() => setBuffering(true)}
            onWaiting={() => setBuffering(true)}
            onStalled={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onPlaying={() => {
              setBuffering(false);
              setFailed(false);
            }}
            onError={(e) => onVideoError(e.currentTarget)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(v.currentTime / v.duration);
            }}
          >
            {/* "#t=0.001" makes the browser show the first frame instead of a black box.
                .mov is declared as mp4 because Chrome only accepts the mp4 label (H.264 inside plays fine). */}
            <source src={`${videoUrl}#t=0.001`} type={/\.webm($|\?)/i.test(videoUrl || "") ? "video/webm" : "video/mp4"} onError={(e) => onVideoError(e.currentTarget.parentElement as HTMLVideoElement)} />
          </video>
        ) : (
          <SmartImage src={thumb} alt={post.caption || "Reel"} hint={`${food?.name || ""} ${post.caption || ""}`} className="absolute inset-0" sizes="100vw" />
        )}
        <div className="reel-shade pointer-events-none absolute inset-0" />
        {post.reel?.url && buffering && !failed && !paused && visible && (
          <div className="pointer-events-none absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 backdrop-blur" role="status" aria-label="Loading video">
            <Spinner className="text-4xl !text-white" />
          </div>
        )}
        {post.reel?.url && failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-6 text-center text-white">
            <p className="text-sm font-semibold">Video could not load</p>
            <p className="max-w-[16rem] text-xs text-white/70">{reason || "Check your connection and try again."}</p>
            <button onClick={retry} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy-900">
              <LuRotateCw /> Retry
            </button>
            {videoUrl && (
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/60 underline">
                Open video link
              </a>
            )}
          </div>
        )}
        {post.reel?.url && !failed && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/20"><div className="h-full bg-brand-500 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
        {paused && (
          <button onClick={() => setPaused(false)} className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white" aria-label="Play">
            <LuPlay className="ml-1 fill-white text-2xl" />
          </button>
        )}
        <button onClick={onToggleMute} className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white" aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <LuVolumeX /> : <LuVolume2 />}
        </button>
        {post.isSponsored && <span className="absolute top-4 left-4 rounded-full bg-warning-400 px-2.5 py-0.5 text-[11px] font-bold text-night-900">{post.sponsoredLabel || "Sponsored"}</span>}

        <div className="absolute inset-x-0 bottom-0 p-4 pr-20 text-white md:pr-4">
          <div className="flex items-center gap-2.5">
            <Link href={profilePath(post.author)}>
              <Avatar src={post.author.avatar?.url} name={post.author.displayName} size={40} ring />
            </Link>
            <div className="min-w-0">
              <Link href={profilePath(post.author)} className="block truncate text-sm font-semibold">
                {post.author.displayName}
              </Link>
              <p className="text-[11px] text-white/70">
                {PROFILE_TYPE_LABEL[post.author.profileType || "RESTAURANT"]} · {timeAgo(post.createdAt)}
              </p>
            </div>
            {mine ? (
              <span className="ml-1 rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white/80">Your reel</span>
            ) : (
              <button onClick={follow.toggle} className={cn("ml-1 rounded-full border px-3 py-1 text-xs font-semibold", follow.on ? "border-white/40 text-white/80" : "border-white bg-white text-navy-900")}>
                {follow.on ? "Following" : "Follow"}
              </button>
            )}
          </div>
          {post.caption && <p className="mt-2 line-clamp-3 text-sm text-white/95">{post.caption}</p>}
          {food?._id && (
            <Link href={`/food/${food._id}`} className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3 pl-1.5 text-xs font-semibold text-navy-900 shadow">
              <span className="brand-gradient flex h-7 w-7 items-center justify-center rounded-full text-white">
                <LuShoppingBag />
              </span>
              <span className="truncate">Order {food.name}</span>
              {food.price ? <span className="text-brand-600">{formatPKR(food.price)}</span> : null}
            </Link>
          )}
          <p className="mt-2 text-[11px] text-white/60">{formatCompact(post.reel?.viewCount || post.stats.views)} views</p>
        </div>

        {/* actions on the video (mobile) */}
        <div className="absolute right-3 bottom-24 flex flex-col gap-4 md:hidden">
          <Action icon={<LuHeart className={like.on ? "fill-brand-500" : ""} />} label={formatCompact(Math.max(0, likes))} onClick={like.toggle} active={like.on} />
          <Action icon={<LuMessageCircle />} label={formatCompact(post.stats.comments)} onClick={() => setComments(true)} />
          <Action icon={<LuBookmark className={save.on ? "fill-brand-500" : ""} />} label="Save" onClick={save.toggle} active={save.on} />
          <Action icon={<LuShare2 />} label="Share" onClick={share} />
        </div>
      </div>

      {/* actions beside the video (desktop) */}
      <div className="hidden flex-col gap-5 self-end pb-8 md:flex">
        <Action icon={<LuHeart className={like.on ? "fill-brand-500" : ""} />} label={formatCompact(Math.max(0, likes))} onClick={like.toggle} active={like.on} />
        <Action icon={<LuMessageCircle />} label={formatCompact(post.stats.comments)} onClick={() => setComments(true)} />
        <Action icon={<LuBookmark className={save.on ? "fill-brand-500" : ""} />} label="Save" onClick={save.toggle} active={save.on} />
        <Action icon={<LuShare2 />} label="Share" onClick={share} />
      </div>
      <CommentsSheet post={post} open={comments} onClose={() => setComments(false)} />
    </div>
  );
}

export default function ReelsPage() {
  const params = useSearchParams();
  const start = params.get("start");
  const [muted, setMuted] = useState(true);
  const first = useQuery({ queryKey: ["post", start], queryFn: () => socialApi.post(start as string), enabled: Boolean(start) });
  const feed = useInfiniteQuery({
    queryKey: ["reels-feed"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => socialApi.reels({ cursor: pageParam, limit: 8 }),
    getNextPageParam: (last) => last.nextCursor || undefined,
  });
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage());
    io.observe(el);
    return () => io.disconnect();
  }, [feed]);

  const items = [...(first.data && first.data.postType === "REEL" ? [first.data] : []), ...(feed.data?.pages.flatMap((p) => p.items) || []).filter((p) => p._id !== first.data?._id)];

  return (
    <div className="bg-black md:bg-ink-50">
      <div className="no-scrollbar h-[calc(100dvh-56px-58px)] snap-y snap-mandatory overflow-y-scroll md:h-[calc(100dvh-116px)]">
        {feed.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="text-4xl" />
          </div>
        ) : !items.length ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white md:text-ink-700">
            <LuPlay className="mb-3 text-4xl text-brand-500" />
            <p className="font-semibold">No reels yet</p>
            <p className="mt-1 text-sm opacity-70">Restaurants, chefs and bloggers post 30 - 90 second food reels here.</p>
          </div>
        ) : (
          items.map((post) => <ReelItem key={post._id} post={post} muted={muted} onToggleMute={() => setMuted((m) => !m)} />)
        )}
        <div ref={sentinel} className="h-px" />
      </div>
    </div>
  );
}
