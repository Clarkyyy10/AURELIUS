import { asUser } from "@/server/db";
import { loadTx } from "@/server/transactions/ops";
import { requireUser } from "@/server/auth/session";
import { route } from "@/server/http";
import { kindSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ kind: string; id: string }> };
/** A record the caller may see, or null (customers can't see other customers' records). */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { kind, id } = await params;
  const me = await requireUser();
  return asUser(me.id, (tx) => loadTx(tx, kindSchema.parse(kind), id)).catch(() => null);
});
