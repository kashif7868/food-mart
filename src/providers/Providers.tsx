"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/locationStore";
import { usePrefs } from "@/store/prefsStore";

/* React Query + toasts + session/location restore */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 } },
      })
  );
  const initialize = useAuthStore((s) => s.initialize);
  const hydrate = useLocationStore((s) => s.hydrate);
  const hydratePrefs = usePrefs((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydratePrefs();
    void initialize();
  }, [initialize, hydrate, hydratePrefs]);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
