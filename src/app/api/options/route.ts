import type { NextRequest } from "next/server";
import type { CustomizationOptions } from "@/types";
import { getOptions, saveOptions } from "@/server/catalog";
import { currentUser, requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { optionsSchema } from "@/server/schemas";

/** FR-01 to FR-04 (active options for everyone; the owner may ask for inactive ones too) */
export const GET = route(async (req: NextRequest) => getOptions(await currentUser(), req.nextUrl.searchParams.get("includeInactive") === "1"));
/** FR-47 */
export const PUT = route(async (req) => saveOptions(await requireOwner(), (await readJson(req, optionsSchema)) as unknown as CustomizationOptions));
