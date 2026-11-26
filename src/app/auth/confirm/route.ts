// Opens from the links in the verification and password-reset emails (FR-41, FR-43).
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/server/auth/supabase";
import { IDLE_COOKIE, idleCookieOptions, signSeen } from "@/server/auth/idle";

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "email_change"];

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const recovery = type === "recovery";
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin));

  if (!tokenHash || !type || !TYPES.includes(type)) return to(recovery ? "/reset-password" : "/verify-email?token=invalid");
  const sb = await supabaseServer();
  const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return to(recovery ? "/forgot-password?expired=1" : "/verify-email?token=invalid");

  const res = to(recovery ? "/reset-password?token=recovery" : "/verify-email?token=confirmed");
  res.cookies.set(IDLE_COOKIE, await signSeen(Date.now()), idleCookieOptions);
  return res;
}
