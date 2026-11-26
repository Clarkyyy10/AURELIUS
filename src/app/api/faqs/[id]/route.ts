import { removeFaq, saveFaq } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { faqSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };
export const PUT = route<Ctx>(async (req, { params }) => saveFaq(await requireOwner(), { ...(await readJson(req, faqSchema)), id: (await params).id }));
export const DELETE = route<Ctx>(async (_req, { params }) => {
  await removeFaq(await requireOwner(), (await params).id);
});
