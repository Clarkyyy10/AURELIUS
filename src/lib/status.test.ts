import { describe, expect, it } from "vitest";
import { customOrderStatuses, serviceStatuses } from "./status";

describe("status vocabulary", () => {
  it("lists the 13 custom order statuses", () => {
    expect(Object.keys(customOrderStatuses)).toHaveLength(13);
  });

  it("lists the 13 service request statuses", () => {
    expect(Object.keys(serviceStatuses)).toHaveLength(13);
  });

  it("uses the same label for a shared status in both lifecycles", () => {
    const shared = Object.keys(customOrderStatuses).filter(
      (key) => key in serviceStatuses,
    );
    expect(shared.length).toBeGreaterThan(0);
    for (const key of shared) {
      expect(customOrderStatuses[key as keyof typeof customOrderStatuses]).toBe(
        serviceStatuses[key as keyof typeof serviceStatuses],
      );
    }
  });

  it("uses the full label for a declined service", () => {
    expect(serviceStatuses["return-pending"]).toBe(
      "Declined, item to be returned",
    );
  });

  it("uses kebab-case keys", () => {
    for (const key of [
      ...Object.keys(customOrderStatuses),
      ...Object.keys(serviceStatuses),
    ]) {
      expect(key).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});
