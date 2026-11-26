import { getSettings, saveSettings } from "@/server/catalog";
import { requireOwner } from "@/server/auth/session";
import { readJson, route } from "@/server/http";
import { settingsSchema } from "@/server/schemas";

export const GET = route(async () => getSettings());
/** FR-46 */
export const PUT = route(async (req) => saveSettings(await requireOwner(), await readJson(req, settingsSchema)));
