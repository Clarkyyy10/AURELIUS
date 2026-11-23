import { registerRequestSchema } from "@/lib/validation/schemas";
import { register } from "@/server/auth/service";
import { clientIp, readJson, route } from "@/server/http";

/** FR-41, FR-45 */
export const POST = route(async (req) => ({ user: await register(await readJson(req, registerRequestSchema), clientIp(req)) }));
