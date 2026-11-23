import { rejectRecord } from "@/server/transactions/ops";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { flushAfter } from "@/server/after";
import { reasonSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };
export const POST = route<Ctx>(async (req, { params }) =>
  flushAfter(rejectRecord(await requireOwner(), "order", (await params).id, (await readJson(req, reasonSchema)).reason)),
);
