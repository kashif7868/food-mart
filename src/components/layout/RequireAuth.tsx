"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { PageLoader } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";

/* Client guard for account pages: waits for the session, then sends guests to /login?next=... */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
  }, [ready, user, router, pathname]);
  if (!ready || !user) return <PageLoader />;
  return <>{children}</>;
}
