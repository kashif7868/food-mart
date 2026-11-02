"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaApple, FaFacebookF, FaGooglePlay, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { LuHeart } from "react-icons/lu";

import { Logo } from "@/components/brand/Logo";

/* =========================================================
   FOOTER (design): dark aubergine, logo + tagline, Quick Links,
   For Food Lovers, Support, Download Our App, socials, legal row.
========================================================= */

const COLUMNS = [
  {
    title: "Quick Links",
    links: [
      ["Home", "/"],
      ["Explore", "/explore"],
      ["Reels", "/reels"],
      ["Offers", "/offers"],
    ],
  },
  {
    title: "For Food Lovers",
    links: [
      ["Bloggers", "/bloggers"],
      ["Chefs", "/chefs"],
      ["Restaurants", "/restaurants"],
      ["Food Points", "/food-points"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Help Center", "/help"],
      ["Safety", "/safety"],
      ["Partner With Us", "/partner"],
      ["Contact Us", "/contact"],
    ],
  },
];

const SOCIAL = [
  { icon: FaFacebookF, label: "Facebook", href: "https://facebook.com" },
  { icon: FaXTwitter, label: "X", href: "https://x.com" },
  { icon: FaInstagram, label: "Instagram", href: "https://instagram.com" },
  { icon: FaTiktok, label: "TikTok", href: "https://tiktok.com" },
  { icon: FaYoutube, label: "YouTube", href: "https://youtube.com" },
];

const StoreBadge = ({ icon: Icon, small, big }: { icon: typeof FaApple; small: string; big: string }) => (
  <a href="#" className="flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-3 text-white transition hover:border-white/40" aria-label={`${small} ${big}`}>
    <Icon className="text-xl" />
    <span className="leading-tight">
      <span className="block text-[9px] text-white/70">{small}</span>
      <span className="block text-[13px] font-semibold">{big}</span>
    </span>
  </a>
);

export function Footer() {
  const pathname = usePathname() || "/";
  /* reels page is full screen on mobile */
  if (pathname.startsWith("/reels")) return <div className="hidden md:block"><FooterBody /></div>;
  return <FooterBody />;
}

function FooterBody() {
  return (
    <footer className="footer-gradient relative mt-10 overflow-hidden text-white/80">
      <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-grape-500/20 blur-3xl" />
      <div className="container-fm relative grid gap-8 py-10 md:grid-cols-[1.3fr_repeat(3,1fr)_1.4fr] md:py-12">
        <div>
          <Logo dark />
          <p className="mt-3 max-w-[220px] text-sm text-white/75">
            Good Food Brings
            <br />
            Better People Together.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-sm font-semibold text-white">{col.title}</p>
            <ul className="space-y-2 text-[13px]">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/70 transition hover:text-brand-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Download Our App</p>
          <div className="flex flex-wrap gap-2">
            <StoreBadge icon={FaApple} small="Get it on" big="App Store" />
            <StoreBadge icon={FaGooglePlay} small="Get it on" big="Google Play" />
          </div>
          <div className="mt-5 flex gap-2">
            {SOCIAL.map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-sm transition hover:border-brand-400 hover:text-brand-300">
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-fm flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} FoodMart. All rights reserved.</p>
          <p className="hidden font-script text-xl text-brand-300 lg:flex lg:items-center lg:gap-1">
            Good Food Brighter Days <LuHeart className="text-sm" />
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
