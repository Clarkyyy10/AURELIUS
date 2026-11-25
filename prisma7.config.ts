// Prisma 7 CLI configuration (prisma7.config.ts is the 7.10+ file name).
// The CLI reads the direct connection (DIRECT_URL). The app reads DATABASE_URL
// through the driver adapter in src/shared/db/prisma.ts.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL },
});
