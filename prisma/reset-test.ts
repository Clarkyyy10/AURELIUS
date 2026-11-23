// Clears every transaction from the TEST project so a QA run starts clean (manuscript §3.14:
// fictitious data only; test data deleted after testing). Keeps the catalog, options and accounts.
//   pnpm db:reset-test
import { PrismaClient } from "@prisma/client";
import { assertTestProject } from "./guard";

const prisma = new PrismaClient();

async function main() {
  assertTestProject();
  await prisma.$executeRawUnsafe(`
    TRUNCATE public.payments, public.quotations, public.status_history, public.revision_remarks,
      public.custom_designs, public.order_items, public.orders, public.service_request_services,
      public.service_requests, public.notifications, public.email_outbox, public.chat_sessions,
      public.code_counters, public.login_attempts, public.rate_limits
  `);
  console.log("Test project cleared (catalog, options and accounts kept).");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
