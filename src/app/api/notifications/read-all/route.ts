import { asUser } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { route } from "@/server/http";

export const POST = route(async () => {
  const me = await requireUser();
  await asUser(me.id, (tx) => tx.notification.updateMany({ where: { userId: me.id, read: false }, data: { read: true } }));
});
