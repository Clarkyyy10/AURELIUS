"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useDemoStore } from "@/lib/data/mock/store";
import { DemoBar } from "./DemoBar";

/** Loads the saved demo data from localStorage once the page is in the browser. */
function StoreHydrator() {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <StoreHydrator />
      <DemoBar />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
