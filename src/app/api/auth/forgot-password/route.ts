import { forgotPasswordRequestSchema } from "@/lib/validation/schemas";
import { requestPasswordReset } from "@/server/auth/service";
import { clientIp, readJson, route } from "@/server/http";

/** FR-43 */
export const POST = route(async (req) => {
  await requestPasswordReset(await readJson(req, forgotPasswordRequestSchema), clientIp(req));
});
