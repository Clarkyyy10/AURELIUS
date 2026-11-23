import { describe, expect, it } from "vitest";
import { afterFailure, lockMinutesLeft, lockedMessage } from "./lockout";

const now = new Date("2026-11-24T10:00:00Z");
const later = (min: number) => new Date(now.getTime() + min * 60_000);

describe("login lockout (NFR: 15 minutes after 5 consecutive failures)", () => {
  it("locks on the fifth failure, not before", () => {
    let s = null as ReturnType<typeof afterFailure> | null;
    for (let i = 1; i <= 4; i++) {
      s = afterFailure(s, now);
      expect(lockMinutesLeft(s, now)).toBe(0);
    }
    s = afterFailure(s, now);
    expect(lockMinutesLeft(s, now)).toBe(15);
  });

  it("stays locked for 15 minutes, then starts a fresh count", () => {
    let s = null as ReturnType<typeof afterFailure> | null;
    for (let i = 0; i < 5; i++) s = afterFailure(s, now);
    expect(lockMinutesLeft(s, later(14))).toBe(1);
    expect(lockMinutesLeft(s, later(15))).toBe(0);
    const fresh = afterFailure(s, later(16));
    expect(fresh).toEqual({ failedCount: 1, lockedUntil: null });
  });

  it("explains the lock in plain English", () => {
    expect(lockedMessage(1)).toMatch(/wait 1 minute and try again/);
    expect(lockedMessage(15)).toMatch(/15 minutes/);
  });
});
