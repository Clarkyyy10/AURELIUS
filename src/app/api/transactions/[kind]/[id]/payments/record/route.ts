import { recordPayment } from "@/server/transactions/ops";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { kindSchema, recordPaymentRequestSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ kind: string; id: string }> };
/** FR-18: the owner records a payment received in the store */
export const POST = route<Ctx>(async (req, { params }) => {
  const { kind, id } = await params;
  return flushAfter(recordPayment(await requireOwner(), kindSchema.parse(kind), id, await readJson(req, recordPaymentRequestSchema)));
});
