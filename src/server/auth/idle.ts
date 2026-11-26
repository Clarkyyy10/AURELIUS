// NFR security: "sessions expire after 30 minutes of inactivity". A signed cookie holds the time of
// the user's last request; the proxy signs the session out when it is older than 30 minutes.
// Uses Web Crypto so it works in the proxy and in route handlers.

export const IDLE_COOKIE = "aur_seen";
export const IDLE_LIMIT_MS = 30 * 60_000;
/** Requests made by the app in the background (e.g. a refresh after a notification) don't count as activity. */
export const BACKGROUND_HEADER = "x-aurelius-background";

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set.");
  return "development-only-session-secret";
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function signSeen(at: number): Promise<string> {
  return `${at}.${await hmac(String(at))}`;
}

/** The time in the cookie, or null when it is missing or has been tampered with. */
export async function readSeen(value: string | undefined): Promise<number | null> {
  if (!value) return null;
  const [at, sig] = value.split(".");
  const n = Number(at);
  if (!Number.isFinite(n) || !sig) return null;
  return (await hmac(at)) === sig ? n : null;
}

export function isIdle(lastSeen: number | null, now: number): boolean {
  return lastSeen !== null && now - lastSeen > IDLE_LIMIT_MS;
}

export const idleCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24,
};
