// Calls the AURELIUS API from the browser. Server messages become UserFacingErrors, so pages show
// them exactly like the Phase 1 messages.

import { UserFacingError } from "../repositories";
import { bumpVersion, useClientState } from "../client-state";

export const BACKGROUND_HEADER = "x-aurelius-background";

export interface CallOptions {
  /** A refresh the user didn't ask for (doesn't count as activity for the 30-minute logout). */
  background?: boolean;
  /** Changes data: refetch lists afterwards. Defaults to true for anything but GET. */
  mutates?: boolean;
}

let backgroundUntil = 0;
/** The next few seconds of reads were triggered by a notification, not by the user. */
export function markBackgroundRefresh(ms = 3_000) {
  backgroundUntil = Date.now() + ms;
}

export async function api<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, opts: CallOptions = {}): Promise<T> {
  const background = opts.background ?? (method === "GET" && Date.now() < backgroundUntil);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(background ? { [BACKGROUND_HEADER]: "1" } : {}),
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new UserFacingError("We couldn't reach the store's server. Check your internet connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string } & T;
  if (!res.ok) {
    if (res.status === 401 && data.code === "idle" && typeof window !== "undefined") {
      useClientState.getState().setUser(null);
      // A full page load on purpose: the session has ended, so every cached screen must reset.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?reason=idle&next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new UserFacingError(data.error ?? "Something went wrong on our side. Please try again in a moment.");
  }
  if (opts.mutates ?? method !== "GET") bumpVersion();
  return data;
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}
