import { getPolicies, savePolicies } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { policiesSchema } from "@/server/schemas";

export const GET = route(async () => ({ text: await getPolicies() }));
export const PUT = route(async (req) => {
  await savePolicies(await requireOwner(), (await readJson(req, policiesSchema)).text);
});
