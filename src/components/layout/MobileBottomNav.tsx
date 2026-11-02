"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuClapperboard, LuCompass, LuHouse, LuTicketPercent, LuUser } from "react-icons/lu";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

/* Mobile bottom bar (design): Home · Explore · Reels · Offers · Profile */
export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const user = useAuthStore((s) => s.user);
  const items = [
    { href: "/", label: "Home", icon: LuHouse },
    { href: "/explore", label: "Explore", icon: LuCompass },
    { href: "/reels", label: "Reels", icon: LuClapperboard },
    { href: "/offers", label: "Offers", icon: LuTicketPercent },
    { href: user ? "/account" : "/login", label: "Profile", icon: LuUser },
  ];
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden", pathname.startsWith("/reels") && "border-white/10 bg-black/85")}>
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active(href) ? "text-brand-500" : pathname.startsWith("/reels") ? "text-white/70" : "text-ink-500"
            )}
          >
            <Icon className="text-[21px]" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
