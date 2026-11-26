import { approveCustomOrder, openForReview, rejectRecord, requestRevision, resubmitCustomOrder } from "@/server/transactions/ops";
import { requireOwner, requireVerifiedCustomer } from "@/server/auth/session";
import { notFound, readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { reasonSchema, remarksSchema, resubmitCustomOrderSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string; action: string }> };

/** FR-08 to FR-11 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { id, action } = await params;
  switch (action) {
    case "resubmit":
      return flushAfter(resubmitCustomOrder(await requireVerifiedCustomer(), id, await readJson(req, resubmitCustomOrderSchema)));
    case "review":
      return flushAfter(openForReview(await requireOwner(), id));
    case "revision":
      return flushAfter(requestRevision(await requireOwner(), id, (await readJson(req, remarksSchema)).text));
    case "approve":
      return flushAfter(approveCustomOrder(await requireOwner(), id));
    case "reject":
      return flushAfter(rejectRecord(await requireOwner(), "custom", id, (await readJson(req, reasonSchema)).reason));
    default:
      throw notFound("This action");
  }
});
