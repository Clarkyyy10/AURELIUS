import { describe, expect, it } from "vitest";
import { optionsToRows, rowsToOptions } from "./options";
import { seedOptions } from "@/lib/data/seed/options";

describe("design_options rows ↔ CustomizationOptions (FR-47)", () => {
  it("round-trips every option without loss, in the owner's order", () => {
    const options = seedOptions();
    const rows = optionsToRows(options);
    expect(rows.length).toBe(Object.values(options).reduce((n, list) => n + list.length, 0));
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length); // ids are unique across kinds
    expect(rowsToOptions([...rows].reverse())).toEqual(options);
  });

  it("stores rates in attributes and keeps label/active as columns", () => {
    const row = optionsToRows(seedOptions()).find((r) => r.id === "mat-18k")!;
    expect(row).toMatchObject({ kind: "material", label: "18K Gold", active: true });
    expect(row.attributes).toMatchObject({ ratePerGram: expect.any(Number), densityRatio: expect.any(Number) });
    expect(row.attributes).not.toHaveProperty("id");
  });
});
