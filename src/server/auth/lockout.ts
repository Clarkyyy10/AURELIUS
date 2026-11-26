// NFR security: "login is temporarily blocked for 15 minutes after 5 consecutive failed attempts".
// Counted per email address in login_attempts (server-only table), so it holds across devices.

import { asSystem } from "../db";

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

export interface AttemptState {
  failedCount: number;
  lockedUntil: Date | null;
}

/** Minutes left on a lock, or 0 when the email may try again. */
export function lockMinutesLeft(state: AttemptState | null, now: Date): number {
  if (!state?.lockedUntil || state.lockedUntil <= now) return 0;
  return Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 60_000);
}

/** The state after one more failed attempt. An expired lock starts a fresh count. */
export function afterFailure(state: AttemptState | null, now: Date): AttemptState {
  const expired = state?.lockedUntil && state.lockedUntil <= now;
  const count = (expired ? 0 : (state?.failedCount ?? 0)) + 1;
  return count >= MAX_FAILURES
    ? { failedCount: count, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) }
    : { failedCount: count, lockedUntil: null };
}

export function lockedMessage(minutes: number): string {
  return `Too many failed attempts. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again, or reset your password.`;
}

export async function currentLock(email: string): Promise<number> {
  const row = await asSystem((tx) => tx.loginAttempt.findUnique({ where: { email } }));
  return lockMinutesLeft(row, new Date());
}

/** Records a failed attempt and returns the minutes locked (0 if not locked yet). */
export async function recordFailure(email: string): Promise<number> {
  const now = new Date();
  return asSystem(async (tx) => {
    const row = await tx.loginAttempt.findUnique({ where: { email } });
    const next = afterFailure(row, now);
    await tx.loginAttempt.upsert({
      where: { email },
      create: { email, failedCount: next.failedCount, lockedUntil: next.lockedUntil, lastFailedAt: now },
      update: { failedCount: next.failedCount, lockedUntil: next.lockedUntil, lastFailedAt: now },
    });
    return lockMinutesLeft(next, now);
  });
}

export async function recordSuccess(email: string): Promise<void> {
  await asSystem((tx) => tx.loginAttempt.deleteMany({ where: { email } }));
}
