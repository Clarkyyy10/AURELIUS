import type { NextRequest } from "next/server";
import { asUser } from "@/server/db";
import { listTx } from "@/server/transactions/ops";
import { requireUser } from "@/server/auth/session";
import { route } from "@/server/http";

/** FR-21, FR-23, FR-48: everything the caller may see, newest first. */
export const GET = route(async (req: NextRequest) => {
  const me = await requireUser();
  const customerId = me.role === "customer" ? me.id : (req.nextUrl.searchParams.get("customerId") ?? undefined);
  return asUser(me.id, async (tx) => {
    const all = [...(await listTx(tx, "order", customerId)), ...(await listTx(tx, "custom", customerId)), ...(await listTx(tx, "service", customerId))];
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
});
