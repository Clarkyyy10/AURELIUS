import { profileSchema } from "@/lib/validation/schemas";
import { updateProfile } from "@/server/auth/service";
import { readJson, route } from "@/server/http";

/** FR-44 */
export const PATCH = route(async (req) => ({ user: await updateProfile(await readJson(req, profileSchema)) }));
