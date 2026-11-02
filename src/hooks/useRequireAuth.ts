"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";

/* Returns ensureAuth(): true when signed in, otherwise sends the visitor to /login and comes back afterwards. */
export function useRequireAuth() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (message = "Please sign in to continue") => {
      if (user) return true;
      toast.info(message);
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return false;
    },
    [user, router, pathname]
  );
}
