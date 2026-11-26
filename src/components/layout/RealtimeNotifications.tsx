"use client";

// Phase 2 (FR-49, FR-50): when a notification for the signed-in user is created, Supabase Realtime
// tells the browser, and the bell and any open lists refresh. Row Level Security limits each person
// to their own notifications. These refreshes don't count as activity for the 30-minute logout.

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { useClientState } from "@/lib/data/client-state";
import { markBackgroundRefresh } from "@/lib/data/api/http";

export function RealtimeNotifications() {
  const userId = useClientState((s) => s.user?.id);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!userId || !url || !key) return;
    const sb = createBrowserClient(url, key);
    const channel = sb
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        const title = (payload.new as { title?: string }).title;
        if (title) toast.info(title);
        markBackgroundRefresh();
        useClientState.getState().bump();
      })
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
