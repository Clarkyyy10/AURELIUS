import { recordDropOff } from "@/server/transactions/ops";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { dropOffSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };
/** FR-30 */
export const POST = route<Ctx>(async (req, { params }) =>
  flushAfter(recordDropOff(await requireOwner(), (await params).id, await readJson(req, dropOffSchema))),
);
