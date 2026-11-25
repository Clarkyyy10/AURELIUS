import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "./env";

const publicValues = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

const serverValues = {
  ...publicValues,
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  DATABASE_URL: "postgresql://user:pass@host:6543/db",
  DIRECT_URL: "postgresql://user:pass@host:5432/db",
};

describe("env validation", () => {
  it("accepts complete public values", () => {
    expect(parsePublicEnv(publicValues)).toEqual(publicValues);
  });

  it("rejects a missing public key", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: publicValues.NEXT_PUBLIC_SUPABASE_URL,
      }),
    ).toThrow();
  });

  it("rejects a Supabase URL that is not a URL", () => {
    expect(() =>
      parsePublicEnv({
        ...publicValues,
        NEXT_PUBLIC_SUPABASE_URL: "not a url",
      }),
    ).toThrow();
  });

  it("accepts complete server values", () => {
    expect(parseServerEnv(serverValues)).toEqual(serverValues);
  });

  it("rejects server values with an empty secret", () => {
    expect(() =>
      parseServerEnv({ ...serverValues, SUPABASE_SERVICE_ROLE_KEY: "" }),
    ).toThrow();
  });
});
