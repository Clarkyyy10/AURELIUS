import { z } from "zod";
import { chat } from "@/server/chat/service";
import { currentUser } from "@/server/auth/session";
import { clientIp, readJson, route } from "@/server/http";

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1500) }))
    .min(1)
    .max(40),
  sessionId: z.uuid(),
});

/** FR-35 to FR-40: the store assistant (Gemini 2.5 Flash, scripted fallback). */
export const POST = route(async (req) => {
  const { messages, sessionId } = await readJson(req, chatSchema);
  return chat(await currentUser(), messages, sessionId, clientIp(req));
});
