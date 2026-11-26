import { saveService } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { serviceRequestCatalogSchema } from "@/server/schemas";

type Ctx = { params: Promise<{ id: string }> };
export const PUT = route<Ctx>(async (req, { params }) =>
  saveService(await requireOwner(), { ...(await readJson(req, serviceRequestCatalogSchema)), id: (await params).id }),
);
