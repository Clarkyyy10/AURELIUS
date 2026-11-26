import type { NextRequest } from "next/server";
import { asUser } from "@/server/db";
import { listTx, submitServiceRequest } from "@/server/transactions/ops";
import { requireUser, requireVerifiedCustomer } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { submitServiceRequestSchema } from "@/server/schemas";

export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  const customerId = me.role === "customer" ? me.id : (req.nextUrl.searchParams.get("customerId") ?? undefined);
  return asUser(me.id, (tx) => listTx(tx, "service", customerId));
});
/** FR-26 */
export const POST = route(async (req) => flushAfter(submitServiceRequest(await requireVerifiedCustomer(), await readJson(req, submitServiceRequestSchema))));
