import { describe, expect, it } from "vitest";
import { formatPeso, formatPesoExact, formatWeight, slugify, todayISODate } from "./format";

describe("format", () => {
  it("formats pesos without decimals", () => {
    expect(formatPeso(24026)).toBe("₱24,026");
    expect(formatPeso(2263.5)).toBe("₱2,264");
  });
  it("formats exact pesos with centavos when needed", () => {
    expect(formatPesoExact(313.5)).toBe("₱313.50");
    expect(formatPesoExact(5000)).toBe("₱5,000");
  });
  it("formats weight to 0.01 g", () => {
    expect(formatWeight(3.3)).toBe("3.30 g");
  });
  it("slugifies names", () => {
    expect(slugify("Classic Solitaire Ring!")).toBe("classic-solitaire-ring");
  });
});

describe("todayISODate (Philippine calendar day, D-14)", () => {
  it("uses Manila time, not the server's UTC clock", () => {
    // 23:30 UTC on Nov 24 is already 07:30 on Nov 25 in Manila
    expect(todayISODate(new Date("2026-11-24T23:30:00Z"))).toBe("2026-11-25");
    expect(todayISODate(new Date("2026-11-24T15:59:00Z"))).toBe("2026-11-24");
    expect(todayISODate(new Date("2026-11-24T16:00:00Z"))).toBe("2026-11-25");
  });
});
