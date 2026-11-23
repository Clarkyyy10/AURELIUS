"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { EstimateError } from "@/lib/pricing/estimate";
import { InvalidTransitionError } from "@/lib/status/machines";
import { UserFacingError } from "./repositories";
import { useDemoStore } from "./mock/store";
import { useClientState } from "./client-state";
import { IS_API } from "./source";
import type { UserProfile } from "@/types";
import { repos } from "./index";
import { seedSettings } from "./seed/catalog";

/** Turn any error into a message that is safe and useful to show. */
export function errorMessage(e: unknown): string {
  if (e instanceof UserFacingError || e instanceof EstimateError || e instanceof InvalidTransitionError) return e.message;
  return "Something went wrong on our side. Please try again in a moment.";
}

interface QueryState<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * Load data from a repository with loading / error states. Refetches when `key` changes or when
 * the mock database changes (Phase 2: Supabase Realtime triggers the refetch instead).
 */
/** "Something changed" counter and readiness, from the mock store (Phase 1) or the client state (Phase 2). */
const useMockSync = () => ({ version: useDemoStore((s) => s.version), hydrated: useDemoStore((s) => s.hydrated) });
const useApiSync = () => ({ version: useClientState((s) => s.version), hydrated: useClientState((s) => s.hydrated) });
export const useDataSync: () => { version: number; hydrated: boolean } = IS_API ? useApiSync : useMockSync;

export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const { version, hydrated } = useDataSync();
  const [state, setState] = useState<QueryState<T>>({ key: "" });
  const [reloadCount, setReloadCount] = useState(0);

  const run = useEffectEvent((cancelled: { v: boolean }) => {
    fetcher().then(
      (data) => !cancelled.v && setState({ key, data }),
      (e) => !cancelled.v && setState({ key, error: errorMessage(e) }),
    );
  });

  useEffect(() => {
    if (!hydrated) return;
    const cancelled = { v: false };
    run(cancelled);
    return () => {
      cancelled.v = true;
    };
  }, [key, version, hydrated, reloadCount]);

  const fresh = state.key === key;
  return {
    data: fresh ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: !fresh,
    reload: useCallback(() => setReloadCount((n) => n + 1), []),
  };
}

function useMockUser(): { user: UserProfile | null; ready: boolean } {
  const ready = useDemoStore((s) => s.hydrated);
  const user = useDemoStore((s) => s.users.find((u) => u.id === s.sessionUserId) ?? null);
  return { user, ready };
}
function useApiUser(): { user: UserProfile | null; ready: boolean } {
  const ready = useClientState((s) => s.hydrated);
  const user = useClientState((s) => s.user);
  return { user, ready };
}
/** The signed-in user: the mock session (Phase 1) or the Supabase session from the server (Phase 2). */
export const useCurrentUser: () => { user: UserProfile | null; ready: boolean } = IS_API ? useApiUser : useMockUser;

/** A design kept while the customer logs in or registers, so it is waiting for them afterwards. */
export function usePendingDesign() {
  const mock = useDemoStore((s) => s.pendingDesign);
  const api = useClientState((s) => s.pendingDesign);
  return IS_API ? api : mock;
}
export function setPendingDesign(d: (import("@/types").DesignConfig & { fromProductId?: string }) | null) {
  if (IS_API) useClientState.getState().setPendingDesign(d);
  else useDemoStore.setState({ pendingDesign: d });
}

/** Run a mutation with a pending flag and a user-facing error message. */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setPending(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(errorMessage(e));
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);
  return { run, pending, error, setError };
}

export function newRequestId(): string {
  return crypto.randomUUID();
}

/** Store settings (address, hours, payment instructions). Falls back to the seed values while loading. */
export function useSettings() {
  const q = useQuery("settings", () => repos.settings.get());
  return q.data ?? seedSettings;
}

/** Service id → name, for showing service requests. */
export function useServiceNames(): Record<string, string> {
  const q = useQuery("service-names", () => repos.catalog.listServices({ includeHidden: true }));
  const names: Record<string, string> = {};
  for (const s of q.data ?? []) names[s.id] = s.name;
  return names;
}

/** Owner only: customer id → profile, for showing names in lists. */
export function useCustomerMap() {
  const q = useQuery("customers", () => repos.customers.list());
  const map: Record<string, UserProfile> = {};
  for (const c of q.data ?? []) map[c.id] = c;
  return { map, list: q.data, query: q };
}
