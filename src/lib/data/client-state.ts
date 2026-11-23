"use client";

// Browser state for the Phase 2 (api) data layer: the signed-in user, a version number that makes
// lists refetch after changes, and a design kept while the customer logs in. The records themselves
// always come from the server.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DesignConfig, UserProfile } from "@/types";

interface ClientState {
  hydrated: boolean;
  user: UserProfile | null;
  version: number;
  pendingDesign: (DesignConfig & { fromProductId?: string }) | null;
  setUser: (user: UserProfile | null) => void;
  bump: () => void;
  setPendingDesign: (d: ClientState["pendingDesign"]) => void;
}

export const useClientState = create<ClientState>()(
  persist(
    (set) => ({
      hydrated: false,
      user: null,
      version: 0,
      pendingDesign: null,
      setUser: (user) => set((s) => ({ user, hydrated: true, version: s.version + 1 })),
      bump: () => set((s) => ({ version: s.version + 1 })),
      setPendingDesign: (pendingDesign) => set({ pendingDesign }),
    }),
    {
      name: "aurelius-client",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ pendingDesign: s.pendingDesign }),
      skipHydration: true,
    },
  ),
);

/** Lists and details refetch whenever something changed. */
export const bumpVersion = () => useClientState.getState().bump();
