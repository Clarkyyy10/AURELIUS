import { asUser } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { route } from "@/server/http";
import type { AppNotification, NotificationType } from "@/types";

/** FR-49, FR-50: the caller's own notifications, newest first */
export const GET = route(async () => {
  const me = await requireUser();
  const rows = await asUser(me.id, (tx) => tx.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 100 }));
  return rows.map((n): AppNotification => ({
    id: n.id,
    userId: n.userId,
    type: n.type as NotificationType,
    title: n.title,
    body: n.body,
    link: n.link,
    channels: n.channels as AppNotification["channels"],
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
});
