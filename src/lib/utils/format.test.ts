import { describe, expect, it } from "vitest";
import { formatPeso, formatPesoExact, formatWeight, slugify } from "./format";

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
