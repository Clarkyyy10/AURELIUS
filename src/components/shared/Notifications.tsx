"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";
import { cn } from "@/lib/utils";
import type { AppNotification, UserProfile } from "@/types";
import { DateText } from "./Text";
import { EmptyState, QueryView } from "./States";

export function useNotifications(user: UserProfile | null) {
  return useQuery(`notifications:${user?.id ?? "none"}`, async () => (user ? repos.notifications.list(user.id) : []));
}

/** Bell with unread count and the latest 8 notifications (FR-49, FR-50). */
export function NotificationBell({ user, tone = "dark" }: { user: UserProfile; tone?: "dark" | "light" }) {
  const q = useNotifications(user);
  const router = useRouter();
  const list = q.data ?? [];
  const unread = list.filter((n) => !n.read).length;
  const viewAll = user.role === "owner" ? "/admin/notifications" : "/account/notifications";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", tone === "light" && "text-ivory hover:bg-sidebar-accent hover:text-ivory")}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-8 px-0" onClick={() => void repos.notifications.markAllRead(user.id)}>
              <CheckCheck className="size-4" /> Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto">
          {list.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">{q.loading ? "Loading…" : "No notifications yet."}</p>
          ) : (
            list.slice(0, 8).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  void repos.notifications.markRead(n.id);
                  router.push(n.link);
                }}
                className={cn("block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-muted", !n.read && "bg-gold/5")}
              >
                <NotificationText n={n} />
              </button>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <Link href={viewAll} className="block px-3 py-2.5 text-center text-sm text-gold-dark hover:underline">
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationText({ n }: { n: AppNotification }) {
  return (
    <span className="flex gap-2">
      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-gold-dark" aria-label="Unread" />}
      <span className={cn("min-w-0", n.read && "pl-4")}>
        <span className="block text-sm font-medium text-ink">{n.title}</span>
        <span className="block text-sm text-muted-foreground">{n.body}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <DateText value={n.createdAt} relative />
          {n.channels.includes("email") && (
            <>
              {" · "}
              <Mail className="size-3" aria-hidden /> also emailed
            </>
          )}
        </span>
      </span>
    </span>
  );
}

/** Full list (account and admin notification pages). */
export function NotificationList({ user }: { user: UserProfile }) {
  const q = useNotifications(user);
  const router = useRouter();
  return (
    <div className="space-y-3">
      {(q.data ?? []).some((n) => !n.read) && (
        <Button variant="outline" onClick={() => void repos.notifications.markAllRead(user.id)}>
          <CheckCheck className="size-4" /> Mark all as read
        </Button>
      )}
      <QueryView query={q} empty={(d) => (d.length === 0 ? <EmptyState title="No notifications yet" description="We'll let you know here when something changes." /> : null)}>
        {(list) => (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
            {list.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    void repos.notifications.markRead(n.id);
                    router.push(n.link);
                  }}
                  className={cn("block w-full px-4 py-3 text-left hover:bg-muted", !n.read && "bg-gold/5")}
                >
                  <NotificationText n={n} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </div>
  );
}
