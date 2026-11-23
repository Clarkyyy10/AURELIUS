import type { NextRequest } from "next/server";
import { asUser } from "@/server/db";
import { listTx, placeOrder } from "@/server/transactions/ops";
import { requireUser, requireVerifiedCustomer } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { placeOrderSchema } from "@/server/schemas";

export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  const customerId = me.role === "customer" ? me.id : (req.nextUrl.searchParams.get("customerId") ?? undefined);
  return asUser(me.id, (tx) => listTx(tx, "order", customerId));
});
/** FR-14 */
export const POST = route(async (req) => flushAfter(placeOrder(await requireVerifiedCustomer(), await readJson(req, placeOrderSchema))));
