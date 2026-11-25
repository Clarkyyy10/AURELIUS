import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

// Strip comments so prose does not count as a color.
const code = css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("globals.css color tokens (DESIGN.md section 4)", () => {
  it("uses only neutral hex colors (red = green = blue)", () => {
    const hexes = code.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(hexes.length).toBeGreaterThan(0);
    for (const hex of hexes) {
      let digits = hex.slice(1);
      if (digits.length === 3 || digits.length === 4) {
        digits = [...digits].map((c) => c + c).join("");
      }
      const [r, g, b] = [0, 2, 4].map((i) => digits.slice(i, i + 2));
      expect(r === g && g === b, hex).toBe(true);
    }
  });

  it("uses no other color function than rgb() with equal neutral channels", () => {
    expect(code).not.toMatch(/\b(oklch|oklab|hsl|hsla|lab|lch|hwb|color)\(/);
    const rgbs = [...code.matchAll(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/g)];
    for (const m of rgbs) {
      expect(m[1] === m[2] && m[2] === m[3], m[0]).toBe(true);
    }
  });

  it("has no dark mode", () => {
    expect(code).not.toMatch(/prefers-color-scheme:\s*dark/);
    expect(code).not.toMatch(/@custom-variant\s+dark/);
    expect(code).not.toMatch(/\.dark\b/);
  });

  it("maps destructive to black", () => {
    expect(code).toMatch(/--destructive:\s*#000000/);
  });
});
