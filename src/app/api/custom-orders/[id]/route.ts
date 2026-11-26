import { asUser } from "@/server/db";
import { loadTx } from "@/server/transactions/ops";
import { requireUser } from "@/server/auth/session";
import { route } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };
/** A custom order the caller may see, or null (customers can't see other customers' records). */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const me = await requireUser();
  return asUser(me.id, (tx) => loadTx(tx, "custom", id)).catch(() => null);
});
