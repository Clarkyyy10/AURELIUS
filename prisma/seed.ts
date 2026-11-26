// Seeds the store's starting data from the same seed files the Phase 1 demo uses.
// Safe to run more than once and on the live project: it only adds what is missing and never
// overwrites the owner's changes. Demo customers are created only with --demo on the TEST project.
//
//   pnpm db:seed            catalog, services, 3D options and rates, FAQs, settings
//   pnpm db:seed -- --demo  + demo customer accounts (test project only; needs TEST_USER_PASSWORD)

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { seedOptions } from "../src/lib/data/seed/options";
import { seedFaqs, seedPolicies, seedProducts, seedServices, seedSettings } from "../src/lib/data/seed/catalog";
import { optionsToRows } from "../src/server/options";
import { assertTestProject } from "./guard";

const prisma = new PrismaClient();

async function main() {
  const rows = optionsToRows(seedOptions());
  const options = await prisma.designOption.createMany({
    data: rows.map((r) => ({ id: r.id, kind: r.kind, label: r.label, active: r.active, sortOrder: r.sortOrder, attributes: r.attributes as object })),
    skipDuplicates: true,
  });

  const services = await prisma.service.createMany({
    data: seedServices().map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      appliesTo: s.appliesTo,
      icon: s.icon,
      hidden: s.hidden,
      sortOrder: s.sortOrder,
    })),
    skipDuplicates: true,
  });

  await prisma.storeSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...seedSettings, policies: seedPolicies },
    update: {},
  });

  let faqs = 0;
  if ((await prisma.faq.count()) === 0) {
    faqs = (await prisma.faq.createMany({ data: seedFaqs().map(({ question, answer, keywords, active }) => ({ question, answer, keywords, active })) })).count;
  }

  let products = 0;
  if ((await prisma.product.count()) === 0) {
    products = (
      await prisma.product.createMany({
        data: seedProducts(new Date()).map((p) => ({
          slug: p.slug,
          name: p.name,
          description: p.description,
          category: p.category,
          material: p.material,
          price: p.price,
          photos: p.photos,
          design: p.design ?? undefined,
          availability: p.availability,
          hidden: p.hidden,
        })),
      })
    ).count;
  }

  console.log(`Seeded: ${options.count} options, ${services.count} services, ${faqs} FAQs, ${products} products (existing rows were left as they are).`);

  if (process.argv.includes("--demo")) await seedDemoCustomers();
}

/** Demo customer accounts for testing (test project only). */
async function seedDemoCustomers() {
  assertTestProject();
  const password = process.env.TEST_USER_PASSWORD;
  if (!password || password.length < 12) throw new Error("Set TEST_USER_PASSWORD (12+ characters) in .env.local to create demo customers.");
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const people = [
    ["maria.santos@example.test", "Maria Santos", "09171234567"],
    ["jose.reyes@example.test", "Jose Reyes", "09181234567"],
    ["ana.cruz@example.test", "Ana Cruz", "09191234567"],
  ];
  for (const [email, fullName, contactNumber] of people) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(`Could not create ${email}: ${error?.message}`);
    await prisma.user.create({ data: { id: data.user.id, email, fullName, contactNumber, privacyConsentAt: new Date(), privacyNoticeVer: "demo" } });
    console.log(`Created demo customer ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
