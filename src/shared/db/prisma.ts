import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/shared/env.server";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The app connects through the pooled DATABASE_URL. Created on first use and
// reused across hot reloads in development.
export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: getServerEnv().DATABASE_URL }),
  });
  return globalForPrisma.prisma;
}
