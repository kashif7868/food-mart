import { LogoMark } from "@/components/brand/Logo";

/* Route-segment fallback (also the Suspense boundary for pages that read search params) */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading FoodMart">
      <LogoMark size={52} className="animate-pulse" />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-ink-100">
        <div className="brand-gradient h-full w-1/2 animate-[fade-up_1s_ease-in-out_infinite_alternate] rounded-full" />
      </div>
    </div>
  );
}
