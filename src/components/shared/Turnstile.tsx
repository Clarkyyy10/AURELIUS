"use client";

// Cloudflare Turnstile (manuscript §3.10, §3.15): a bot check on login, registration and password
// reset. Most people see no puzzle. Shown only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set (Phase 2).

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Renders the check and reports its token (null when it expires or fails). `resetKey` re-runs the
 * check after a failed submit, because each token can be used only once.
 */
export function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const report = useRef(onToken);
  useEffect(() => {
    report.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          theme: "light",
          callback: (t: string) => report.current(t),
          "expired-callback": () => report.current(null),
          "error-callback": () => report.current(null),
        });
      })
      .catch(() => report.current(null));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey && widget.current && window.turnstile) {
      window.turnstile.reset(widget.current);
      report.current(null);
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" aria-label="Security check" />;
}
