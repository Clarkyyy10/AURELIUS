import { resetPasswordRequestSchema } from "@/lib/validation/schemas";
import { resetPassword } from "@/server/auth/service";
import { readJson, route } from "@/server/http";

/** FR-43 */
export const POST = route(async (req) => {
  await resetPassword((await readJson(req, resetPasswordRequestSchema)).password);
});
