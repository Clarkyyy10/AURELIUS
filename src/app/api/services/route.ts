import type { NextRequest } from "next/server";
import { listServices, saveService } from "@/server/catalog";
import { currentUser, requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { serviceRequestCatalogSchema } from "@/server/schemas";

/** FR-25 */
export const GET = route(async (req: NextRequest) => listServices(await currentUser(), req.nextUrl.searchParams.get("includeHidden") === "1"));
/** FR-34 */
export const POST = route(async (req) => saveService(await requireOwner(), await readJson(req, serviceRequestCatalogSchema)));
