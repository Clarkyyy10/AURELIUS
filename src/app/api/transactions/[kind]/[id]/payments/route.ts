import { submitPayment } from "@/server/transactions/ops";
import { requireVerifiedCustomer } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { customerPaymentRequestSchema, kindSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ kind: string; id: string }> };
/** FR-17: the customer submits payment details and proof */
export const POST = route<Ctx>(async (req, { params }) => {
  const { kind, id } = await params;
  return flushAfter(submitPayment(await requireVerifiedCustomer(), kindSchema.parse(kind), id, await readJson(req, customerPaymentRequestSchema)));
});
