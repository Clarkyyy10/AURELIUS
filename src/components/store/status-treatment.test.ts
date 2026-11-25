import { describe, expect, it } from "vitest";
import { customOrderStatuses, serviceStatuses } from "@/shared/status";
import {
  getStatusTreatment,
  isStatusKey,
  proofStatuses,
  requiresReason,
  statusKeys,
} from "./status-treatment";

describe("status treatment", () => {
  it("covers every key of the custom order and service lifecycles", () => {
    for (const key of [
      ...Object.keys(customOrderStatuses),
      ...Object.keys(serviceStatuses),
      ...Object.keys(proofStatuses),
    ]) {
      expect(isStatusKey(key), key).toBe(true);
      expect(getStatusTreatment(key).known, key).toBe(true);
    }
  });

  it("uses the label from the shared vocabulary", () => {
    expect(getStatusTreatment("under-review").label).toBe("Under review");
    expect(getStatusTreatment("return-pending").label).toBe(
      "Declined, item to be returned",
    );
    expect(getStatusTreatment("proof-pending").label).toBe(
      "Pending verification",
    );
  });

  it("maps the status classes from DESIGN.md section 11", () => {
    expect(getStatusTreatment("draft").variant).toBe("neutral");
    expect(getStatusTreatment("in-production").variant).toBe("progress");
    expect(getStatusTreatment("quotation-issued").variant).toBe("pending");
    expect(getStatusTreatment("claimed").variant).toBe("complete");
    expect(getStatusTreatment("unclaimed").variant).toBe("attention");
    expect(getStatusTreatment("rejected").variant).toBe("rejected");
    expect(getStatusTreatment("proof-rejected").variant).toBe("rejected");
  });

  it("keeps the black fill for the complete class only", () => {
    // Complete is the only black fill class, so no other class may share it.
    const complete = statusKeys.filter(
      (key) => getStatusTreatment(key).variant === "complete",
    );
    expect(complete).toContain("claimed");
    expect(complete).not.toContain("unclaimed");
  });

  it("requires a reason only for rejections", () => {
    expect(requiresReason("rejected")).toBe(true);
    expect(requiresReason("proof-rejected")).toBe(true);
    expect(requiresReason("claimed")).toBe(false);
  });

  it("falls back to the neutral treatment and keeps the raw text for an unknown key", () => {
    const unknown = getStatusTreatment("something-new");
    expect(unknown.known).toBe(false);
    expect(unknown.variant).toBe("neutral");
    expect(unknown.label).toBe("something-new");
  });

  it("does not list the open statuses", () => {
    expect(isStatusKey("proof-expired")).toBe(false);
    expect(isStatusKey("placed")).toBe(false);
    expect(isStatusKey("expired")).toBe(false);
  });
});
