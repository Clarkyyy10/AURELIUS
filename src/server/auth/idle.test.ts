// @vitest-environment node
import { describe, expect, it } from "vitest";
import { IDLE_LIMIT_MS, isIdle, readSeen, signSeen } from "./idle";

describe("30-minute idle logout (NFR security)", () => {
  it("accepts its own signed time and rejects a changed one", async () => {
    const cookie = await signSeen(1_000_000);
    expect(await readSeen(cookie)).toBe(1_000_000);
    const [, sig] = cookie.split(".");
    expect(await readSeen(`9999999999999.${sig}`)).toBeNull(); // pushing the time forward is detected
    expect(await readSeen("garbage")).toBeNull();
    expect(await readSeen(undefined)).toBeNull();
  });

  it("is idle only after more than 30 minutes", () => {
    const t = 1_000_000;
    expect(isIdle(t, t + IDLE_LIMIT_MS)).toBe(false);
    expect(isIdle(t, t + IDLE_LIMIT_MS + 1)).toBe(true);
    expect(isIdle(null, t)).toBe(false);
  });
});
