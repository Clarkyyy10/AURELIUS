// Database access for the server (Phase 2). Every request runs inside one transaction as the private
// "aurelius_app" role with the signed-in user's id set, so Row Level Security applies to every query
// and each change saves completely or not at all (NFR transaction integrity).

import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type Tx = Prisma.TransactionClient;

const TX_OPTIONS = { maxWait: 5_000, timeout: 15_000 } as const;

/** Runs `fn` as the given user (null = a guest) with Row Level Security enforced. */
export function asUser<T>(userId: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const claims = JSON.stringify(userId ? { sub: userId, role: "authenticated" } : {});
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`;
    await tx.$executeRawUnsafe("SET LOCAL ROLE aurelius_app");
    return fn(tx);
  }, TX_OPTIONS);
}

/**
 * Privileged transaction for server bookkeeping that no user may touch directly (login lockout,
 * rate limits, sending queued emails, registration). Never pass user input to it unchecked.
 */
export function asSystem<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn, TX_OPTIONS);
}

/** Prisma Decimal (numeric) → number of pesos or grams. Values here are far below 2^53. */
export const num = (d: Prisma.Decimal | number | null | undefined): number => (d == null ? 0 : typeof d === "number" ? d : d.toNumber());
