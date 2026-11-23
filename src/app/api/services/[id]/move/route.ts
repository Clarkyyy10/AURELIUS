import { moveService } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { moveSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };
export const POST = route<Ctx>(async (req, { params }) => {
  await moveService(await requireOwner(), (await params).id, (await readJson(req, moveSchema)).direction);
});
