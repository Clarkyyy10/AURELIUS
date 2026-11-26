import type { AnyStatus } from "@/types";
import { cancelRecord, changeStatus, issueQuotation, respondToQuotation } from "@/server/transactions/ops";
import { requireOwner, requireUser } from "@/server/auth/session";
import { forbidden, notFound, readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { cancelSchema, kindSchema, quotationRequestSchema, quotationResponseSchema, statusChangeSchema } from "@/server/schemas";
import { serviceQuotationSchema } from "@/lib/validation/schemas";

type Ctx = { params: Promise<{ kind: string; id: string; action: string }> };

/** FR-15, FR-16, FR-20, FR-22, FR-27 to FR-29, FR-33 */
export const POST = route<Ctx>(async (req, { params }) => {
  const p = await params;
  const kind = kindSchema.parse(p.kind);
  switch (p.action) {
    case "status": {
      const me = await requireOwner(); // FR-20, FR-29: the owner updates statuses
      const { to, note } = await readJson(req, statusChangeSchema);
      return flushAfter(changeStatus(me, kind, p.id, to as AnyStatus, note));
    }
    case "quotation": {
      const me = await requireOwner();
      const input = await readJson(req, kind === "service" ? serviceQuotationSchema : quotationRequestSchema);
      return flushAfter(issueQuotation(me, kind, p.id, input));
    }
    case "quotation-response": {
      const me = await requireUser();
      if (me.role !== "customer") throw forbidden("Only the customer can accept or decline a quotation.");
      const { decision, reason } = await readJson(req, quotationResponseSchema);
      return flushAfter(respondToQuotation(me, kind, p.id, decision, reason));
    }
    case "cancel": {
      const me = await requireUser();
      return flushAfter(cancelRecord(me, kind, p.id, (await readJson(req, cancelSchema)).reason));
    }
    default:
      throw notFound("This action");
  }
});
