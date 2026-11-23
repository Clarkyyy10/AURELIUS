// Shared handling for API routes: JSON in and out, same-origin check on changes, body size limit,
// and plain-English errors (NFR usability: say what went wrong and how to fix it). Unexpected errors
// are logged on the server and never shown in detail to the user.

import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UserFacingError } from "@/lib/data/repositories";
import { EstimateError } from "@/lib/pricing/estimate";
import { InvalidTransitionError } from "@/lib/status/machines";

/** An error with an HTTP status and a message that is safe to show. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const unauthorized = () => new HttpError(401, "Please log in to continue.");
export const forbidden = (msg = "You don't have access to this.") => new HttpError(403, msg);
export const notFound = (what = "This record") => new HttpError(404, `${what} was not found. It may have been removed, or the link is wrong.`);

const MAX_JSON_BYTES = 64 * 1024;

/** Reads and validates a JSON body with a zod schema (the same schemas the forms use). */
export async function readJson<T>(req: NextRequest | Request, schema: ZodType<T>): Promise<T> {
  const text = await req.text();
  if (text.length > MAX_JSON_BYTES) throw new HttpError(413, "That request is too large. Shorten the text and try again.");
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "The request could not be read. Refresh the page and try again.");
  }
  return schema.parse(body);
}

/** Blocks changes sent from other websites (defence against cross-site request forgery). */
export function assertSameOrigin(req: NextRequest | Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) throw forbidden("This request was blocked. Refresh the page and try again.");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden("This request was blocked. Refresh the page and try again.");
  }
  if (originHost !== host) throw forbidden("This request was blocked because it came from another website.");
}

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  if (e instanceof UserFacingError || e instanceof EstimateError) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof InvalidTransitionError) return NextResponse.json({ error: e.message }, { status: 409 });
  if (isUniqueViolation(e)) return NextResponse.json({ error: "This was already saved. Refresh the page to see it." }, { status: 409 });
  console.error("[api] unexpected error", e);
  return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment." }, { status: 500 });
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<unknown>;

/** Wraps a route handler: same-origin check, JSON response, no caching, safe errors. */
export function route<C = { params: Promise<Record<string, string>> }>(handler: Handler<C>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      assertSameOrigin(req);
      const result = await handler(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** The caller's IP address (for the login lockout and rate limits), as reported by Vercel. */
export function clientIp(req: NextRequest | Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
