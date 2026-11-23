// Sends queued emails through Resend (manuscript §3.10). Called right after a change commits and
// by the daily retry job. Emails carry only what the notification says plus a link (data minimization).

import { asSystem } from "./db";
import { optionalEnv, siteUrl } from "./env";

const MAX_ATTEMPTS = 5;

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderNotificationEmail(p: { name?: string; title: string; body: string; link: string }) {
  const url = `${siteUrl()}${p.link.startsWith("/") ? p.link : "/"}`;
  const text = `Hi ${p.name ?? "there"},\n\n${p.body}\n\nOpen it in AURELIUS: ${url}\n\nAfable's Jewelry Store · Montalban Public Market, Rizal\nThis is an automatic message about your request. The owner confirms all final prices and dates.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f1e9;font-family:Arial,Helvetica,sans-serif;color:#1f2a24">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-size:18px;letter-spacing:4px;color:#8a6d2c;margin:0 0 16px">AURELIUS</p>
<div style="background:#fffdf9;border:1px solid #e6dccb;border-radius:12px;padding:24px">
<p style="margin:0 0 12px">Hi ${escape(p.name ?? "there")},</p>
<p style="margin:0 0 8px;font-weight:bold">${escape(p.title)}</p>
<p style="margin:0 0 20px;line-height:1.5">${escape(p.body)}</p>
<a href="${escape(url)}" style="display:inline-block;background:#1f4d3a;color:#fffdf9;text-decoration:none;padding:12px 20px;border-radius:8px">Open in AURELIUS</a>
</div>
<p style="font-size:12px;color:#6b6b6b;margin-top:16px">Afable's Jewelry Store · Montalban Public Market, Rizal. This is an automatic message about your request. The owner confirms all final prices and dates.</p>
</div></body></html>`;
  return { text, html };
}

/** Sends pending emails. Safe to call often; each email is sent at most once. */
export async function flushOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  const key = optionalEnv("RESEND_API_KEY");
  const from = optionalEnv("EMAIL_FROM");
  if (!key || !from) return { sent: 0, failed: 0 }; // not configured (development): emails stay queued
  const pending = await asSystem((tx) =>
    tx.emailOutbox.findMany({ where: { status: { in: ["pending", "failed"] }, attempts: { lt: MAX_ATTEMPTS } }, orderBy: { createdAt: "asc" }, take: limit }),
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
