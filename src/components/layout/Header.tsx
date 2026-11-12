"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  LuChevronDown,
  LuCrosshair,
  LuHeart,
  LuLayoutDashboard,
  LuLogOut,
  LuMapPin,
  LuMenu,
  LuReceipt,
  LuSearch,
  LuShoppingBag,
  LuUser,
  LuX,
} from "react-icons/lu";

import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { LanguageButton, PrefsPanel, ThemeButton } from "@/components/layout/PrefsToggle";
import { Avatar } from "@/components/ui";
import { cartCount, useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { partnerProfiles, useAuthStore } from "@/store/authStore";
import { CITIES, useLocationStore } from "@/store/locationStore";

/* =========================================================
   HEADER (design)
   Desktop: logo · location · search · heart · bag · Sign In / Sign Up
            + centred nav row (Home, Explore, Reels, Offers, ...)
   Tablet : one row (nav links in the menu drawer)
   Mobile : menu · logo · search icon (bottom nav handles the rest)
========================================================= */

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/reels", label: "Reels" },
  { href: "/offers", label: "Offers" },
  { href: "/bloggers", label: "Bloggers" },
  { href: "/chefs", label: "Chefs" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/food-points", label: "Food Points" },
];

import { DASHBOARD_URL } from "@/lib/config";
export { DASHBOARD_URL };

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOutside();
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler as unknown as EventListener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler as unknown as EventListener);
    };
  }, [onOutside]);
  return ref;
}

export function LocationPicker({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { city, coords, setCity, locate } = useLocationStore();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn("flex h-11 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 text-[13px] font-medium text-ink-800 transition hover:border-brand-300", compact && "h-10 px-3 text-xs")}
      >
        <LuMapPin className="shrink-0 text-base text-brand-500" />
        <span className="max-w-[140px] truncate">{coords ? "Near me" : compact ? city : `${city}, Pakistan`}</span>
        <LuChevronDown className="shrink-0 text-ink-400" />
      </button>
      {open && (
        <div className="animate-fade-up absolute top-12 left-0 z-50 w-60 rounded-2xl border border-ink-100 bg-white p-2 shadow-pop">
          <button
            onClick={async () => {
              const ok = await locate();
              setOpen(false);
              if (!ok) toast.error("Location permission was not granted. Pick your city instead.");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            <LuCrosshair /> Use my current location
          </button>
          <div className="my-1 h-px bg-ink-100" />
          <div className="max-h-64 overflow-y-auto">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCity(c);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-ink-50", c === city && !coords && "font-semibold text-brand-600")}
              >
                {c}
                {c === city && !coords && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchBox({ className, placeholder = "Search for restaurants, cuisines, food points, chefs, bloggers..." }: { className?: string; placeholder?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : "/explore");
  };
  return (
    <form onSubmit={submit} className={cn("relative", className)} role="search">
      <LuSearch className="absolute top-1/2 start-4 -translate-y-1/2 text-lg text-ink-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search FoodMart"
        className="h-11 w-full rounded-full border border-ink-200 bg-white pe-4 ps-11 text-[13px] text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
      />
    </form>
  );
}

function AccountMenu() {
  const { user, profiles, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  if (!user) return null;
  const partners = partnerProfiles(profiles);
  const team = user.globalRoles?.length > 0;
  const item = "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-ink-50" aria-label="Account menu">
        <Avatar src={user.avatar?.url} name={user.name} size={38} />
        <LuChevronDown className="hidden text-ink-400 lg:block" />
      </button>
      {open && (
        <div className="animate-fade-up absolute top-12 right-0 z-50 w-64 rounded-2xl border border-ink-100 bg-white p-2 shadow-pop" onClick={() => setOpen(false)}>
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
            <p className="truncate text-xs text-ink-500">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-ink-100" />
          <Link href="/account" className={item}>
            <LuUser /> My account
          </Link>
          <Link href="/orders" className={item}>
            <LuReceipt /> My orders
          </Link>
          <Link href="/favourites" className={item}>
            <LuHeart /> Favourites & saved
          </Link>
          {(partners.length > 0 || team) && (
            <a href={DASHBOARD_URL} className={cn(item, "font-semibold text-grape-700")}>
              <LuLayoutDashboard /> {team ? "FoodMart panel" : "Partner dashboard"}
            </a>
          )}
          <div className="my-1 h-px bg-ink-100" />
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className={cn(item, "w-full text-danger-600")}
          >
            <LuLogOut /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function CartButton() {
  const { data } = useCart();
  const count = cartCount(data);
  return (
    <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition hover:bg-ink-50" aria-label="Cart">
      <LuShoppingBag className="text-[22px]" />
      {count > 0 && <span className="brand-gradient absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">{count}</span>}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname() || "/";
  const { user, ready } = useAuthStore();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const authButtons = (
    <div className="flex w-full items-center gap-2 lg:w-auto">
      <Link href="/login" className="inline-flex h-11 flex-1 items-center justify-center rounded-full border-2 border-grape-600 px-5 lg:h-10 lg:flex-none text-sm font-semibold text-grape-700 transition hover:bg-grape-50">
        Sign In
      </Link>
      <Link href="/signup" className="grape-gradient inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 lg:h-10 lg:flex-none text-sm font-semibold text-white shadow-grape transition hover:brightness-110">
        Sign Up
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/95 backdrop-blur">
      {/* desktop + tablet */}
      <div className="container-fm hidden h-[72px] items-center gap-3 md:flex lg:gap-4">
        <button onClick={() => setDrawer(true)} className="rounded-full p-2 text-ink-700 hover:bg-ink-50 lg:hidden" aria-label="Open menu">
          <LuMenu className="text-xl" />
        </button>
        <Logo />
        <LocationPicker className="hidden lg:block" />
        <SearchBox className="mx-1 min-w-0 flex-1 lg:mx-3" />
        <LocationPicker compact className="lg:hidden" />
        <LanguageButton className="hidden lg:flex" />
        <ThemeButton />
        <Link href="/favourites" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition hover:bg-ink-50" aria-label="Favourites">
          <LuHeart className="text-[22px]" />
        </Link>
        <CartButton />
        {!ready ? <div className="h-10 w-40" /> : user ? <AccountMenu /> : <div className="hidden lg:block">{authButtons}</div>}
        {ready && !user && (
          <Link href="/login" className="grape-gradient inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold text-white lg:hidden">
            Sign In
          </Link>
        )}
      </div>
      <nav className="hidden h-11 items-center justify-center gap-1 lg:flex" aria-label="Main">
        {NAV.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "relative px-4 py-2 text-[13px] font-medium transition",
              isActive(pathname, l.href) ? "text-brand-500 after:absolute after:inset-x-4 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-brand-500" : "text-ink-700 hover:text-brand-500"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* mobile */}
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <button onClick={() => setDrawer(true)} className="-ml-2 rounded-full p-2 text-ink-800" aria-label="Open menu">
          <LuMenu className="text-[22px]" />
        </button>
        <Logo size={28} />
        <div className="flex items-center">
          <LanguageButton className="h-9 px-2" />
          <ThemeButton className="h-9 w-9" />
          <Link href="/explore" className="rounded-full p-2 text-ink-800" aria-label="Search">
            <LuSearch className="text-[22px]" />
          </Link>
          {user ? (
            <CartButton />
          ) : (
            ready && (
              <Link href="/login" className="grape-gradient ml-1 inline-flex h-8 items-center rounded-full px-3.5 text-xs font-semibold text-white">
                Sign In
              </Link>
            )
          )}
        </div>
      </div>

      <MenuDrawer open={drawer} onClose={() => setDrawer(false)} pathname={pathname} authButtons={authButtons} user={Boolean(user)} />
    </header>
  );
}

/* The drawer is rendered in a portal on <body>. Inside the header it would be
   clipped to the header's height, because `backdrop-blur` makes the header the
   containing block of every `position: fixed` child. */
function MenuDrawer({ open, onClose, pathname, authButtons, user }: { open: boolean; onClose: () => void; pathname: string; authButtons: ReactNode; user: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;
  const link = "flex items-center rounded-xl px-3 py-3 text-[15px] font-medium";
  return createPortal(
    <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-night-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-drawer-in absolute inset-y-0 start-0 flex h-dvh w-[86%] max-w-[320px] flex-col bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <Logo size={30} />
          <button onClick={onClose} className="rounded-full p-2 text-ink-500 hover:bg-ink-100" aria-label="Close menu">
            <LuX className="text-xl" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <LocationPicker className="mb-4 md:hidden" />
          <div className="mb-4">
            <PrefsPanel />
          </div>
          <nav className="grid gap-1" onClick={onClose}>
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className={cn(link, isActive(pathname, l.href) ? "bg-brand-50 text-brand-600" : "text-ink-700 hover:bg-ink-50")}>
                {l.label}
              </Link>
            ))}
            <Link href="/awards" className={cn(link, "text-ink-700 hover:bg-ink-50")}>
              FoodMart Awards
            </Link>
            <Link href="/partner" className={cn(link, "font-semibold text-grape-700 hover:bg-grape-50")}>
              Partner with us
            </Link>
          </nav>
        </div>
        <div className="border-t border-ink-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={onClose}>
          {user ? <AccountMenuInline /> : authButtons}
        </div>
      </aside>
    </div>,
    document.body
  );
}

function AccountMenuInline() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <Avatar src={user.avatar?.url} name={user.name} size={40} />
      <Link href="/account" className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <p className="truncate text-xs text-ink-500">View account</p>
      </Link>
      <button
        onClick={async () => {
          await logout();
          router.push("/");
        }}
        className="rounded-full p-2 text-danger-500 hover:bg-danger-50"
        aria-label="Sign out"
      >
        <LuLogOut />
      </button>
    </div>
  );
}
