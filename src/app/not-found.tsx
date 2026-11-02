import Link from "next/link";

import { FoodArt } from "@/components/brand/FoodArt";

export default function NotFound() {
  return (
    <div className="container-fm flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="h-36 w-36">
        <FoodArt kind="burger" />
      </div>
      <p className="mt-4 text-6xl font-extrabold text-brand-gradient">404</p>
      <h1 className="mt-2 text-xl font-bold text-navy-900">This page is off the menu</h1>
      <p className="mt-1 text-sm text-ink-500">The page you were looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="brand-gradient mt-6 inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold text-white shadow-glow">
        Back to home
      </Link>
    </div>
  );
}
