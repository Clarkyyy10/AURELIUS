import { changePasswordRequestSchema } from "@/lib/validation/schemas";
import { changePassword } from "@/server/auth/service";
import { readJson, route } from "@/server/http";

/** FR-44 */
export const POST = route(async (req) => {
  await changePassword(await readJson(req, changePasswordRequestSchema));
});
