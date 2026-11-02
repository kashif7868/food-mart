import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Caveat, Poppins } from "next/font/google";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Providers } from "@/providers/Providers";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FoodMart - Discover Food You'll Love", template: "%s | FoodMart" },
  description: "Explore amazing restaurants, hidden food points, top chefs, food bloggers and local flavors - all in one place.",
  applicationName: "FoodMart",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ff6b1a" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${poppins.variable} ${caveat.variable}`}>
        <Providers>
          <Suspense fallback={<div className="h-16 border-b border-ink-100" />}>
            <Header />
          </Suspense>
          <main id="fm-main" className="min-h-[60vh] pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
