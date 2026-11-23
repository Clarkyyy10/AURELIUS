import { loginRequestSchema } from "@/lib/validation/schemas";
import { login } from "@/server/auth/service";
import { clientIp, readJson, route } from "@/server/http";

/** FR-42 (NFR: lockout after 5 failures, Turnstile) */
export const POST = route(async (req) => ({ user: await login(await readJson(req, loginRequestSchema), clientIp(req)) }));
