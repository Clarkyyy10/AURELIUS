// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ownedPath, parseFileRef, sniffType } from "./files";

const ME = "11111111-2222-4333-8444-555555555555";
const OTHER = "99999999-2222-4333-8444-555555555555";

describe("uploaded files (NFR: type and size checked on the server; files can't run)", () => {
  it("recognises JPG, PNG and PDF by their content, not their name", () => {
    expect(sniffType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(sniffType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull(); // HTML renamed to .png
    expect(sniffType(new TextEncoder().encode("MZ\x90\x00"))).toBeNull(); // a Windows program
    expect(sniffType(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull(); // GIF is not allowed
  });

  it("only accepts references in the user's own folder", () => {
    expect(ownedPath(`file:payment-proofs/${ME}/a.pdf`, "payment-proofs", ME)).toBe(`${ME}/a.pdf`);
    expect(() => ownedPath(`file:payment-proofs/${OTHER}/a.pdf`, "payment-proofs", ME)).toThrow(/Attach it again/);
    expect(() => ownedPath(`file:service-photos/${ME}/a.jpg`, "payment-proofs", ME)).toThrow();
    expect(() => ownedPath(`file:payment-proofs/${ME}/../${OTHER}/a.pdf`, "payment-proofs", ME)).toThrow();
  });

  it("rejects malformed references", () => {
    expect(parseFileRef("file:other-bucket/x/y.png")).toBeNull();
    expect(parseFileRef("https://evil.example/x.png")).toBeNull();
    expect(parseFileRef(`file:payment-proofs/${ME}/../../etc/passwd`)).toBeNull();
  });
});
