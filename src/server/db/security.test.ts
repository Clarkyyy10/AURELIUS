// @vitest-environment node
// Row Level Security and integrity rules (docs/phase2-plan.md §3; NFR security: customers can't see
// or change other customers' records, admin functions are owner-only, including direct requests).

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asApp, migratedDb } from "../testing/pglite";

const OWNER = "00000000-0000-4000-8000-000000000001";
const ANA = "00000000-0000-4000-8000-00000000000a";
const BEN = "00000000-0000-4000-8000-00000000000b";
let db: PGlite;
let anaOrder: string;
let benOrder: string;
let benService: string;

async function expectDenied(p: Promise<unknown>) {
  await expect(p).rejects.toThrow(/permission denied|row-level security|violates/i);
}

beforeAll(async () => {
  db = await migratedDb();
  for (const [id, email, role] of [
    [OWNER, "owner@example.test", "owner"],
    [ANA, "ana@example.test", "customer"],
    [BEN, "ben@example.test", "customer"],
  ]) {
    await db.query("INSERT INTO auth.users (id, email) VALUES ($1, $2)", [id, email]);
    await db.query(
      "INSERT INTO users (id, role, full_name, email, contact_number, privacy_consent_at, privacy_notice_version, updated_at) VALUES ($1, $2, $3, $4, '09171234567', now(), 'v1', now())",
      [id, role, email.split("@")[0], email],
    );
  }
  await db.exec(`
    INSERT INTO products (id, slug, name, description, category, material, price, photos, availability, hidden, updated_at) VALUES
      ('10000000-0000-4000-8000-000000000001', 'ring', 'Ring', 'A ring', 'ring', '18K Gold', 1000, '{}', 'available', false, now()),
      ('10000000-0000-4000-8000-000000000002', 'hidden', 'Hidden', 'Hidden', 'ring', '18K Gold', 1000, '{}', 'unavailable', true, now());
    INSERT INTO services (id, name, description, applies_to, icon, hidden, sort_order) VALUES ('svc-repair', 'Repair', 'Fix it', '{jewelry}', 'wrench', false, 1);
  `);
  anaOrder = (
    await asApp(
      db,
      ANA,
      (q) =>
        q<{ id: string }>(
          "INSERT INTO orders (code, kind, customer_id, status, source, client_request_id, updated_at) VALUES ('ORD-2026-0001', 'product', $1, 'pending', 'catalog', 'req-a', now()) RETURNING id",
          [ANA],
        ),
      true,
    )
  )[0].id;
  benOrder = (
    await asApp(
      db,
      BEN,
      (q) =>
        q<{ id: string }>(
          "INSERT INTO orders (code, kind, customer_id, status, source, client_request_id, updated_at) VALUES ('ORD-2026-0002', 'product', $1, 'pending', 'catalog', 'req-b', now()) RETURNING id",
          [BEN],
        ),
      true,
    )
  )[0].id;
  benService = (
    await asApp(
      db,
      BEN,
      (q) =>
        q<{ id: string }>(
          "INSERT INTO service_requests (code, customer_id, item_type, item_description, details, photos, source, status, client_request_id, updated_at) VALUES ('SR-2026-0001', $1, 'jewelry', 'Gold ring', 'Loose stone', '{}', 'form', 'submitted', 'req-s', now()) RETURNING id",
          [BEN],
        ),
      true,
    )
  )[0].id;
  await db.query(
    "INSERT INTO notifications (user_id, type, title, body, link, channels) VALUES ($1, 'x', 'For Ana', 'b', '/', '{in_app}'), ($2, 'x', 'For Ben', 'b', '/', '{in_app}')",
    [ANA, BEN],
  );
});

afterAll(async () => {
  await db.close();
});

describe("the public Data API is closed", () => {
  it("anon and authenticated cannot read or change app tables directly", async () => {
    for (const role of ["anon", "authenticated"]) {
      for (const table of ["products", "orders", "users", "payments", "design_options", "login_attempts"]) {
        await expectDenied(
          db.transaction(async (tx) => {
            await tx.exec(`SET LOCAL ROLE ${role}`);
            await tx.query(`SELECT * FROM ${table}`);
          }),
        );
      }
    }
  });

  it("a signed-in user can read only their own notifications (Realtime bell)", async () => {
    const rows = await db.transaction(async (tx) => {
      await tx.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: ANA })]);
      await tx.exec("SET LOCAL ROLE authenticated");
      return (await tx.query<{ title: string }>("SELECT title FROM notifications")).rows;
    });
    expect(rows.map((r) => r.title)).toEqual(["For Ana"]);
  });
});

describe("catalog", () => {
  it("guests and customers see only visible products; the owner sees all", async () => {
    expect(await asApp(db, null, (q) => q("SELECT slug FROM products ORDER BY slug"))).toEqual([{ slug: "ring" }]);
    expect(await asApp(db, ANA, (q) => q("SELECT slug FROM products ORDER BY slug"))).toEqual([{ slug: "ring" }]);
    expect(await asApp(db, OWNER, (q) => q("SELECT slug FROM products ORDER BY slug"))).toHaveLength(2);
  });

  it("only the owner can change products, services and options", async () => {
    const ana = await asApp(db, ANA, (q) => q("UPDATE products SET price = 1 RETURNING id"));
    expect(ana).toHaveLength(0); // no rows visible for update
    await expectDenied(
      asApp(db, ANA, (q) =>
        q("INSERT INTO services (id, name, description, applies_to, icon, hidden, sort_order) VALUES ('svc-x', 'X', 'x', '{jewelry}', 'x', false, 9)"),
      ),
    );
    expect(await asApp(db, OWNER, (q) => q("UPDATE products SET price = 2000 RETURNING id"))).toHaveLength(2);
  });
});

describe("customers' records", () => {
  it("a customer sees only their own orders and service requests", async () => {
    expect(await asApp(db, ANA, (q) => q("SELECT code FROM orders"))).toEqual([{ code: "ORD-2026-0001" }]);
    expect(await asApp(db, ANA, (q) => q("SELECT id FROM service_requests"))).toEqual([]);
    expect(await asApp(db, ANA, (q) => q("SELECT id FROM orders WHERE id = $1", [benOrder]))).toEqual([]);
    expect(await asApp(db, OWNER, (q) => q("SELECT id FROM orders"))).toHaveLength(2);
  });

  it("a customer cannot change another customer's record, even by id", async () => {
    expect(await asApp(db, ANA, (q) => q("UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING id", [benOrder]))).toEqual([]);
    expect(await asApp(db, ANA, (q) => q("UPDATE service_requests SET status = 'cancelled' WHERE id = $1 RETURNING id", [benService]))).toEqual([]);
  });

  it("a customer cannot create records in someone else's name", async () => {
    await expectDenied(
      asApp(db, ANA, (q) =>
        q(
          "INSERT INTO orders (code, kind, customer_id, status, source, client_request_id, updated_at) VALUES ('ORD-X', 'product', $1, 'pending', 'catalog', 'req-x', now())",
          [BEN],
        ),
      ),
    );
    await expectDenied(
      asApp(db, ANA, (q) =>
        q(
          "INSERT INTO payments (order_id, kind, amount, paid_on, method, recorded_by, status) VALUES ($1, 'full_payment', 100, now(), 'gcash', 'customer', 'pending_verification')",
          [benOrder],
        ),
      ),
    );
  });

  it("a customer can submit a pending payment for their own order but cannot mark it verified", async () => {
    const ok = await asApp(db, ANA, (q) =>
      q(
        "INSERT INTO payments (order_id, kind, amount, paid_on, method, recorded_by, status) VALUES ($1, 'full_payment', 100, now(), 'gcash', 'customer', 'pending_verification') RETURNING id",
        [anaOrder],
      ),
    );
    expect(ok).toHaveLength(1);
    await expectDenied(
      asApp(db, ANA, (q) =>
        q(
          "INSERT INTO payments (order_id, kind, amount, paid_on, method, recorded_by, status) VALUES ($1, 'full_payment', 100, now(), 'gcash', 'customer', 'verified')",
          [anaOrder],
        ),
      ),
    );
  });

  it("the owner cannot place orders as a customer", async () => {
    await expectDenied(
      asApp(db, OWNER, (q) =>
        q(
          "INSERT INTO orders (code, kind, customer_id, status, source, client_request_id, updated_at) VALUES ('ORD-O', 'product', $1, 'pending', 'catalog', 'req-o', now())",
          [OWNER],
        ),
      ),
    );
  });

  it("only the owner issues quotations", async () => {
    await expectDenied(
      asApp(db, ANA, (q) => q("INSERT INTO quotations (order_id, final_price, down_payment_required, expected_date) VALUES ($1, 100, 0, now())", [anaOrder])),
    );
    expect(
      await asApp(db, OWNER, (q) =>
        q("INSERT INTO quotations (order_id, final_price, down_payment_required, expected_date) VALUES ($1, 100, 0, now()) RETURNING id", [anaOrder]),
      ),
    ).toHaveLength(1);
  });
});

describe("accounts", () => {
  it("a customer sees only their own profile; the owner sees everyone", async () => {
    expect(await asApp(db, ANA, (q) => q("SELECT email FROM users"))).toEqual([{ email: "ana@example.test" }]);
    expect(await asApp(db, OWNER, (q) => q("SELECT email FROM users"))).toHaveLength(3);
  });

  it("a customer can change their name and number but never their role or consent", async () => {
    expect(await asApp(db, ANA, (q) => q("UPDATE users SET full_name = 'Ana Cruz' WHERE id = $1 RETURNING full_name", [ANA]))).toEqual([
      { full_name: "Ana Cruz" },
    ]);
    await expectDenied(asApp(db, ANA, (q) => q("UPDATE users SET role = 'owner' WHERE id = $1", [ANA])));
    await expectDenied(asApp(db, ANA, (q) => q("UPDATE users SET privacy_consent_at = null WHERE id = $1", [ANA])));
  });

  it("login lockout data, rate limits and code counters are server-only", async () => {
    for (const table of ["login_attempts", "rate_limits", "code_counters"]) await expectDenied(asApp(db, OWNER, (q) => q(`SELECT * FROM ${table}`)));
  });
});

describe("integrity", () => {
  it("codes count up per prefix and year", async () => {
    const year = new Date().getFullYear();
    const a = await asApp(db, ANA, (q) => q<{ c: string }>("SELECT public.next_code('CO') AS c"), true);
    const b = await asApp(db, ANA, (q) => q<{ c: string }>("SELECT public.next_code('CO') AS c"), true);
    expect(a[0].c).toMatch(new RegExp(`^CO-(${year}|${year + 1})-0001$`));
    expect(b[0].c).toMatch(/-0002$/);
    await expect(asApp(db, ANA, (q) => q("SELECT public.next_code('XX')"))).rejects.toThrow(/unknown code prefix/);
  });

  it("an order can have only one current quotation, and amounts must make sense", async () => {
    await asApp(
      db,
      OWNER,
      (q) => q("INSERT INTO quotations (order_id, final_price, down_payment_required, expected_date) VALUES ($1, 500, 100, now())", [benOrder]),
      true,
    );
    await expect(
      asApp(db, OWNER, (q) =>
        q("INSERT INTO quotations (order_id, final_price, down_payment_required, expected_date) VALUES ($1, 600, 100, now())", [benOrder]),
      ),
    ).rejects.toThrow(/duplicate key|unique/i);
    await expect(
      asApp(db, OWNER, (q) =>
        q("INSERT INTO quotations (order_id, final_price, down_payment_required, expected_date) VALUES ($1, 100, 500, now())", [anaOrder]),
      ),
    ).rejects.toThrow(/quotations_amounts/);
  });

  it("the same submission can't be saved twice", async () => {
    await expect(
      asApp(db, ANA, (q) =>
        q(
          "INSERT INTO orders (code, kind, customer_id, status, source, client_request_id, updated_at) VALUES ('ORD-2026-0099', 'product', $1, 'pending', 'catalog', 'req-a', now())",
          [ANA],
        ),
      ),
    ).rejects.toThrow(/duplicate key|unique/i);
  });

  it("payment proofs must be JPG, PNG or PDF up to 5 MB", async () => {
    await expect(
      asApp(db, ANA, (q) =>
        q(
          "INSERT INTO payments (order_id, kind, amount, paid_on, method, recorded_by, status, proof_type, proof_size_bytes) VALUES ($1, 'balance', 1, now(), 'gcash', 'customer', 'pending_verification', 'image/gif', 10)",
          [anaOrder],
        ),
      ),
    ).rejects.toThrow(/payments_proof_rules/);
    await expect(
      asApp(db, ANA, (q) =>
        q(
          "INSERT INTO payments (order_id, kind, amount, paid_on, method, recorded_by, status, proof_type, proof_size_bytes) VALUES ($1, 'balance', 1, now(), 'gcash', 'customer', 'pending_verification', 'image/png', 6000000)",
          [anaOrder],
        ),
      ),
    ).rejects.toThrow(/payments_proof_rules/);
  });
});
