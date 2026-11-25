// Sends queued emails through Resend (manuscript §3.10). Called right after a change commits and
// by the daily retry job. Emails carry only what the notification says plus a link (data minimization).

import { asSystem } from "./db";
import { optionalEnv, siteUrl } from "./env";

const MAX_ATTEMPTS = 5;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderNotificationEmail(p: { name?: string; title: string; body: string; link: string }) {
  const url = `${siteUrl()}${p.link.startsWith("/") ? p.link : "/"}`;
  // Monochrome like the site (docs/design/DESIGN.md); only the store name, never AURELIUS (DESIGN.md §2).
  const text = `Hi ${p.name ?? "there"},

${p.body}

Open your request: ${url}

Afable's Jewelry Store · Montalban Public Market, Rizal
This is an automatic message about your request. The owner confirms all final prices and dates.`;
  const html = `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#000000">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-family:Georgia,serif;font-size:22px;color:#000000;margin:0 0 16px">Afable's Jewelry Store</p>
<div style="background:#ffffff;border:1px solid #8c8c8c;border-radius:4px;padding:24px">
<p style="margin:0 0 12px">Hi ${escape(p.name ?? "there")},</p>
<p style="margin:0 0 8px;font-weight:bold">${escape(p.title)}</p>
<p style="margin:0 0 20px;line-height:1.5">${escape(p.body)}</p>
<a href="${escape(url)}" style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:2px">Open your request</a>
</div>
<p style="font-size:12px;color:#525252;margin-top:16px">Afable's Jewelry Store · Montalban Public Market, Rizal. This is an automatic message about your request. The owner confirms all final prices and dates.</p>
</div></body></html>`;
  return { text, html };
}

/** Sends pending emails. Safe to call often; each email is sent at most once. */
export async function flushOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  const key = optionalEnv("RESEND_API_KEY");
  const from = optionalEnv("EMAIL_FROM");
  if (!key || !from) return { sent: 0, failed: 0 }; // not configured (development): emails stay queued
  const pending = await asSystem((tx) =>
    tx.emailOutbox.findMany({
      where: {
        attempts: { lt: MAX_ATTEMPTS },
        OR: [
          { status: { in: ["pending", "failed"] } },
          // a send that was cut off (e.g. the server stopped) is retried after 10 minutes
          { status: "sending", createdAt: { lt: new Date(Date.now() - 10 * 60_000) } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    }),
  );
  let sent = 0;
  let failed = 0;
  for (const mail of pending) {
    // Claim the row first so two runs at once can't send the same email twice.
    const claimed = await asSystem((tx) =>
      tx.emailOutbox.updateMany({
        where: { id: mail.id, status: mail.status, attempts: mail.attempts },
        data: { status: "sending", attempts: { increment: 1 } },
      }),
    );
    if (claimed.count === 0) continue;
    const { text, html } = renderNotificationEmail(mail.payload as { name?: string; title: string; body: string; link: string });
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": mail.id },
        body: JSON.stringify({ from, to: [mail.toEmail], subject: mail.subject, text, html }),
        signal: AbortSignal.timeout(8_000),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) throw new Error(data.message ?? `Resend answered ${res.status}`);
      await asSystem((tx) =>
        tx.emailOutbox.update({ where: { id: mail.id }, data: { status: "sent", sentAt: new Date(), providerId: data.id ?? null, lastError: null } }),
      );
      sent++;
    } catch (e) {
      await asSystem((tx) =>
        tx.emailOutbox.update({ where: { id: mail.id }, data: { status: "failed", lastError: String(e instanceof Error ? e.message : e).slice(0, 500) } }),
      );
      failed++;
    }
  }
  return { sent, failed };
}
