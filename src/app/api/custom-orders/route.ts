import type { NextRequest } from "next/server";
import { asUser } from "@/server/db";
import { listTx, submitCustomOrder } from "@/server/transactions/ops";
import { requireUser, requireVerifiedCustomer } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { submitCustomOrderSchema } from "@/server/schemas";

export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  const customerId = me.role === "customer" ? me.id : (req.nextUrl.searchParams.get("customerId") ?? undefined);
  return asUser(me.id, (tx) => listTx(tx, "custom", customerId));
});
/** FR-07 */
export const POST = route(async (req) => flushAfter(submitCustomOrder(await requireVerifiedCustomer(), await readJson(req, submitCustomOrderSchema))));
