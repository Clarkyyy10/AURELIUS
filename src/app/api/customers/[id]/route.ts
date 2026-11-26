import { getCustomer } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { route } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };
export const GET = route<Ctx>(async (_req, { params }) => getCustomer(await requireOwner(), (await params).id));
