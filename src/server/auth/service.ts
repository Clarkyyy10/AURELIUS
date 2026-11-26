// Accounts (FR-41 to FR-45): registration with consent, email verification, login with lockout and
// Turnstile, logout, password reset, profile and password changes. Supabase Auth stores passwords
// hashed with bcrypt and sends the verification and reset emails (through Resend SMTP).

import { cookies } from "next/headers";
import type { UserProfile } from "@/types";
import { asSystem, asUser } from "../db";
import { siteUrl } from "../env";
import { HttpError } from "../http";
import { currentLock, lockedMessage, recordFailure, recordSuccess } from "./lockout";
import { IDLE_COOKIE, idleCookieOptions, signSeen } from "./idle";
import { requireUser, toProfile } from "./session";
import { supabaseAdmin, supabaseServer } from "./supabase";
import { verifyTurnstile } from "./turnstile";

/** Version of the privacy notice the customer agreed to (FR-45). Change it when the notice changes. */
export const PRIVACY_NOTICE_VERSION = "2026-11";
const PENDING_COOKIE = "aur_pending_email";
const pendingCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 };

const confirmUrl = (next?: string) => `${siteUrl()}/auth/confirm${next ? `?next=${encodeURIComponent(next)}` : ""}`;

async function markActive() {
  (await cookies()).set(IDLE_COOKIE, await signSeen(Date.now()), idleCookieOptions);
}

export async function register(
  input: { fullName: string; email: string; contactNumber: string; password: string; captchaToken?: string },
  ip: string,
): Promise<UserProfile> {
  await verifyTurnstile(input.captchaToken, ip);
  const exists = await asSystem((tx) => tx.user.findUnique({ where: { email: input.email }, select: { id: true } }));
  if (exists) throw new HttpError(409, "An account with this email already exists. Sign in, or reset your password if you forgot it.");

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signUp({ email: input.email, password: input.password, options: { emailRedirectTo: confirmUrl() } });
  if (error || !data.user) throw new HttpError(400, authMessage(error?.message));
  if (data.user.identities?.length === 0)
    throw new HttpError(409, "An account with this email already exists. Sign in, or reset your password if you forgot it.");

  try {
    const row = await asSystem((tx) =>
      tx.user.create({
        data: {
          id: data.user!.id,
          email: input.email,
          fullName: input.fullName,
          contactNumber: input.contactNumber,
          privacyConsentAt: new Date(), // FR-45: consent recorded at registration
          privacyNoticeVer: PRIVACY_NOTICE_VERSION,
        },
      }),
    );
    (await cookies()).set(PENDING_COOKIE, input.email, pendingCookieOptions);
    return toProfile(row, false);
  } catch (e) {
    // Keep sign-in data and profile together: undo the sign-in account if the profile could not be saved.
    await supabaseAdmin().auth.admin.deleteUser(data.user.id);
    throw e;
  }
}

export async function login(input: { email: string; password: string; captchaToken?: string }, ip: string): Promise<UserProfile> {
  const locked = await currentLock(input.email);
  if (locked > 0) throw new HttpError(429, lockedMessage(locked));
  await verifyTurnstile(input.captchaToken, ip);

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email: input.email, password: input.password });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      (await cookies()).set(PENDING_COOKIE, input.email, pendingCookieOptions);
      throw new HttpError(403, `Please confirm your email first. Open the link we sent to ${input.email}, or ask for a new link on the next page.`);
    }
    const minutes = await recordFailure(input.email);
    throw new HttpError(minutes > 0 ? 429 : 400, minutes > 0 ? lockedMessage(minutes) : "The email or password is incorrect. Check them and try again.");
  }
  await recordSuccess(input.email);
  await markActive();
  const row = await asUser(data.user.id, (tx) => tx.user.findUnique({ where: { id: data.user.id } }));
  if (!row) throw new HttpError(403, "This account has no profile. Please contact the store.");
  return toProfile(row, Boolean(data.user.email_confirmed_at));
}

export async function logout(): Promise<void> {
  const sb = await supabaseServer();
  await sb.auth.signOut(); // revokes the session (NFR: invalidated on logout)
  const store = await cookies();
  store.delete(IDLE_COOKIE);
  store.delete(PENDING_COOKIE);
}

export async function resendVerification(): Promise<void> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user?.email_confirmed_at) throw new HttpError(400, "Your email is already confirmed.");
  const email = user?.email ?? (await cookies()).get(PENDING_COOKIE)?.value;
  if (!email) throw new HttpError(400, "Sign in with the email you registered, and we'll send a new link.");
  const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmUrl() } });
  if (error) throw new HttpError(429, authMessage(error.message));
}

/** Always answers the same way, so the form can't be used to find out who has an account. */
export async function requestPasswordReset(input: { email: string; captchaToken?: string }, ip: string): Promise<void> {
  await verifyTurnstile(input.captchaToken, ip);
  const sb = await supabaseServer();
  const { error } = await sb.auth.resetPasswordForEmail(input.email, { redirectTo: confirmUrl("/reset-password") });
  if (error && /rate|too many/i.test(error.message)) throw new HttpError(429, "Please wait a minute before asking for another reset link.");
}

/** FR-43: the reset link signs the person in for a short time; this sets the new password. */
export async function resetPassword(password: string): Promise<void> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new HttpError(401, "This reset link has expired or was already used. Ask for a new one.");
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw new HttpError(400, authMessage(error.message));
  await recordSuccess(user.email ?? "");
  await sb.auth.signOut(); // sign in again with the new password everywhere
}

export async function updateProfile(input: { fullName: string; contactNumber: string }): Promise<UserProfile> {
  const me = await requireUser();
  const row = await asUser(me.id, (tx) => tx.user.update({ where: { id: me.id }, data: { fullName: input.fullName, contactNumber: input.contactNumber } }));
  return toProfile(row, me.emailVerified);
}

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  const me = await requireUser();
  const locked = await currentLock(me.email);
  if (locked > 0) throw new HttpError(429, lockedMessage(locked));
  const sb = await supabaseServer();
  const check = await sb.auth.signInWithPassword({ email: me.email, password: input.currentPassword });
  if (check.error) {
    const minutes = await recordFailure(me.email);
    throw new HttpError(minutes > 0 ? 429 : 400, minutes > 0 ? lockedMessage(minutes) : "Your current password is incorrect.");
  }
  const { error } = await sb.auth.updateUser({ password: input.newPassword });
  if (error) throw new HttpError(400, authMessage(error.message));
  await markActive();
}

/** Supabase's messages, in the app's plain English. */
function authMessage(message?: string): string {
  if (!message) return "We couldn't complete that just now. Please try again.";
  if (/password/i.test(message) && /(weak|short|least|pwned|known)/i.test(message))
    return "Choose a stronger password: at least 8 characters that are hard to guess.";
  if (/same/i.test(message) && /password/i.test(message)) return "Choose a new password that is different from your current one.";
  if (/rate|too many|security purposes/i.test(message)) return "Please wait a minute and try again.";
  if (/email/i.test(message) && /invalid/i.test(message)) return "Enter a valid email address, like name@example.com.";
  return "We couldn't complete that just now. Please try again.";
}
