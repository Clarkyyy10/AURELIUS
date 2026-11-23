import { reviewPayment } from "@/server/transactions/ops";
import { requireOwner } from "@/server/auth/session";
import { notFound, readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { kindSchema, reasonSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ kind: string; id: string; paymentId: string; action: string }> };
/** FR-18: the owner verifies or rejects a submitted payment */
export const POST = route<Ctx>(async (req, { params }) => {
  const p = await params;
  const me = await requireOwner();
  const kind = kindSchema.parse(p.kind);
  if (p.action === "verify") return flushAfter(reviewPayment(me, kind, p.id, p.paymentId, "verify"));
  if (p.action === "reject") return flushAfter(reviewPayment(me, kind, p.id, p.paymentId, "reject", (await readJson(req, reasonSchema)).reason));
  throw notFound("This action");
});
