// Who is calling? Reads the Supabase session from cookies (verified with Supabase, not just decoded)
// and loads the profile with Row Level Security. Used by every API route.

import type { User as DbUser } from "@prisma/client";
import type { UserProfile } from "@/types";
import { asUser } from "../db";
import { HttpError, forbidden, unauthorized } from "../http";
import { supabaseServer } from "./supabase";

export function toProfile(row: DbUser, emailVerified: boolean): UserProfile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.fullName,
    email: row.email,
    contactNumber: row.contactNumber,
    emailVerified,
    privacyConsentAt: row.privacyConsentAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/** The signed-in user's profile, or null for a guest. */
export async function currentUser(): Promise<UserProfile | null> {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const row = await asUser(user.id, (tx) => tx.user.findUnique({ where: { id: user.id } }));
  return row ? toProfile(row, Boolean(user.email_confirmed_at)) : null;
}

export async function requireUser(): Promise<UserProfile> {
  const u = await currentUser();
  if (!u) throw unauthorized();
  return u;
}

/** FR-41: customers must have a verified email before placing orders or submitting requests. */
export async function requireVerifiedCustomer(): Promise<UserProfile> {
  const u = await requireUser();
  if (u.role !== "customer") throw forbidden("Owner accounts can't place orders or submit requests.");
  if (!u.emailVerified) throw new HttpError(403, "Please verify your email address before submitting. Check your inbox for the confirmation link.");
  return u;
}

/** FR-46: owner-only functions (NFR: not accessible to customer accounts). */
export async function requireOwner(): Promise<UserProfile> {
  const u = await requireUser();
  if (u.role !== "owner") throw forbidden("This is for the store owner only.");
  return u;
}
