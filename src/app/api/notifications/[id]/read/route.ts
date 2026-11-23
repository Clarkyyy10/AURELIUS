import { asUser } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { route } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };
export const POST = route<Ctx>(async (_req, { params }) => {
  const me = await requireUser();
  const { id } = await params;
  if (/^[0-9a-f-]{36}$/i.test(id)) await asUser(me.id, (tx) => tx.notification.updateMany({ where: { id, userId: me.id }, data: { read: true } }));
});
