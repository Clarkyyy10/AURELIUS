"use client";

import { useSyncExternalStore } from "react";

let cached: boolean | null = null;

/** Detects WebGL before the canvas is mounted (NFR compatibility: no blank viewer). */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    if (new URLSearchParams(window.location.search).get("nowebgl") === "1") return (cached = false);
    const c = document.createElement("canvas");
    cached = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    cached = false;
  }
  return cached;
}

/** null while rendering on the server, then true/false in the browser. */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(
    () => () => {},
    () => hasWebGL(),
    () => null,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
