// Test helper: a real PostgreSQL (PGlite, in-process) with small stand-ins for the parts of Supabase
// our migrations depend on (auth.users, storage.buckets, the Data API roles, the Realtime publication).
// Lets the migrations and every Row Level Security rule be tested without a Supabase project.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const SUPABASE_STUBS = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
  CREATE SCHEMA storage;
  CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  CREATE PUBLICATION supabase_realtime;
  -- Supabase grants new public tables to the Data API roles by default; reproduce that so the test
  -- proves our migration removes the access again.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  CREATE TABLE public._prisma_migrations (id varchar(36) PRIMARY KEY, migration_name varchar(255));
`;

export function migrationFiles(): string[] {
  const dir = join(process.cwd(), "prisma", "migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((name) => readFileSync(join(dir, name, "migration.sql"), "utf8"));
}

/** A fresh database with every migration applied. */
export async function migratedDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  for (const sql of migrationFiles()) await db.exec(sql);
  return db;
}

/**
 * Runs `fn` the way the app server will: in a transaction, as the private app role, with the given
 * user's id in the JWT claims (null = a guest). Rolls back afterwards unless `commit` is true.
 */
export async function asApp<T>(
  db: PGlite,
  userId: string | null,
  fn: (q: <R = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<R[]>) => Promise<T>,
  commit = false,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify(userId ? { sub: userId, role: "authenticated" } : {})]);
    await tx.exec("SET LOCAL ROLE aurelius_app");
    const q = async <R>(sql: string, params?: unknown[]) => (await tx.query<R>(sql, params)).rows;
    const result = await fn(q);
    if (!commit) await tx.rollback();
    return result;
  });
}
