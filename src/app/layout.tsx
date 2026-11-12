import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Caveat, Noto_Naskh_Arabic, Outfit, Plus_Jakarta_Sans } from "next/font/google";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Translator } from "@/components/layout/Translator";
import { AssistantWidget } from "@/components/layout/AssistantWidget";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SITE_URL } from "@/lib/config";
import { Providers } from "@/providers/Providers";
import "./globals.css";

// body text: clean, friendly and very readable on phones
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
// headings and big numbers: rounder and more modern
const outfit = Outfit({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-outfit", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-naskh", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "FoodMart - Discover Food You'll Love", template: "%s | FoodMart" },
  description: "Explore amazing restaurants, hidden food points, top chefs, food bloggers and local flavors - all in one place.",
  applicationName: "FoodMart",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ff6b1a" }, { media: "(prefers-color-scheme: dark)", color: "#120d1f" }] };

/* applies saved language / theme before first paint (no flash) */
const PREPAINT = `try{var d=document.documentElement,l=localStorage.getItem("fm_lang")==="ur"?"ur":"en",t=localStorage.getItem("fm_theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.lang=l;d.dir=l==="ur"?"rtl":"ltr";if(t==="dark")d.classList.add("dark");if(l==="ur")d.classList.add("lang-ur");d.style.colorScheme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body suppressHydrationWarning className={`${jakarta.variable} ${outfit.variable} ${caveat.variable} ${naskh.variable}`}>
        <Providers>
          <Suspense fallback={<div className="h-16 border-b border-ink-100" />}>
            <Header />
          </Suspense>
          <main id="fm-main" className="min-h-[60vh] md:pb-0">
            {children}
          </main>
          <Footer />
          <AssistantWidget />
          <Translator />
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
