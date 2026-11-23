// Cloudflare Turnstile check on login, registration and password reset (manuscript §3.10, §3.15).

import { HttpError } from "../http";
import { isProduction, optionalEnv } from "../env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<void> {
  const secret = optionalEnv("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // Development without keys: allowed. A live deployment must have the key.
    if (isProduction()) throw new Error("TURNSTILE_SECRET_KEY is not set.");
    return;
  }
  if (!token) throw new HttpError(400, "Please complete the security check (the box above the button) and try again.");
  const body = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);
  let ok = false;
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5_000) });
    ok = Boolean(((await res.json()) as { success?: boolean }).success);
  } catch {
    throw new HttpError(503, "We couldn't run the security check just now. Please try again in a moment.");
  }
  if (!ok) throw new HttpError(400, "The security check didn't pass. Please try it again.");
}
