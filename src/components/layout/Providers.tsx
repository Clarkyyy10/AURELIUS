"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useDemoStore } from "@/lib/data/mock/store";
import { useClientState } from "@/lib/data/client-state";
import { IS_API } from "@/lib/data/source";
import { repos } from "@/lib/data";
import { DemoBar } from "./DemoBar";
import { RealtimeNotifications } from "./RealtimeNotifications";

/**
 * Phase 1: loads the saved demo data from localStorage. Phase 2: loads the signed-in user from the
 * server (and the design kept during login from sessionStorage).
 */
function StoreHydrator() {
  useEffect(() => {
    if (!IS_API) {
      void useDemoStore.persist.rehydrate();
      return;
    }
    void useClientState.persist.rehydrate();
    repos.auth.getSession().catch(() => useClientState.getState().setUser(null));
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <StoreHydrator />
      {/* The Demo Mode bar and simulated emails exist only in the Phase 1 demo (manuscript: no demo tools in production). */}
      {IS_API ? <RealtimeNotifications /> : <DemoBar />}
      {children}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
