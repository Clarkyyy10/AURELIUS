// Gives the owner role to the account registered with OWNER_EMAIL (FR-46). Run once per project,
// after the owner has signed up and verified their email:   pnpm db:owner
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Set OWNER_EMAIL in .env.local first.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account uses ${email} yet. Sign up on the site with that email, verify it, then run this again.`);
  const others = await prisma.user.count({ where: { role: "owner", NOT: { id: user.id } } });
  if (others > 0) throw new Error("Another account is already the owner. The store has one owner; change it in the database on purpose if needed.");
  await prisma.user.update({ where: { id: user.id }, data: { role: "owner" } });
  console.log(`${email} is now the store owner.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
