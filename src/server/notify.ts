// Notifications (FR-49, FR-50). Written in the same transaction as the change they describe.
// Customers also get an email: a row in email_outbox, sent through Resend after the change commits,
// so a slow or failed email never undoes a saved record (NFR transaction integrity).

import type { NotificationType } from "@/types";
import type { Tx } from "./db";

export async function ownerId(tx: Tx): Promise<string | null> {
  const rows = await tx.$queryRaw<{ id: string | null }[]>`SELECT public.owner_id() AS id`;
  return rows[0]?.id ?? null;
}

export async function notify(tx: Tx, userId: string | null, type: NotificationType, title: string, body: string, link: string): Promise<void> {
  if (!userId) return;
  const owner = await ownerId(tx);
  const isCustomer = userId !== owner;
  await tx.notification.create({ data: { userId, type, title, body, link, channels: isCustomer ? ["in_app", "email"] : ["in_app"] } });
  if (!isCustomer) return;
  // Only the owner acts on a customer's behalf, and the owner may read customer contact details.
  const to = await tx.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
  if (!to) return;
  await tx.emailOutbox.create({
    data: { toEmail: to.email, template: "notification", subject: title, payload: { name: to.fullName.split(" ")[0], title, body, link } },
  });
}

export async function notifyOwner(tx: Tx, type: NotificationType, title: string, body: string, link: string): Promise<void> {
  await notify(tx, await ownerId(tx), type, title, body, link);
}
