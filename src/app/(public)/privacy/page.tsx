import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Notice" };

const sections: [string, React.ReactNode][] = [
  [
    "What personal data we collect",
    <ul key="a" className="list-disc space-y-1 pl-5">
      <li>Your full name, email address, and mobile number, when you register.</li>
      <li>The details of your orders, custom designs, and service requests (for example, the item, size, and notes you write).</li>
      <li>Payment details you submit: amount, date, reference number, and a photo or PDF of your receipt.</li>
      <li>Photos of items you send with a service request.</li>
    </ul>,
  ],
  [
    "Why we collect it",
    <p key="b">
      Only to process your orders and requests: to review your design, send quotations, verify your payments, update you on progress, and contact you when your
      item is ready. We do not use your data for advertising, and we do not sell it.
    </p>,
  ],
  [
    "Who can see it",
    <p key="c">
      Only you and the store owner. The AURELIUS assistant (chatbot) does not receive your name, email, or mobile number. Our hosting providers store the data
      securely on our behalf.
    </p>,
  ],
  [
    "How long we keep it",
    <p key="d">
      While your account is active, and afterwards only as long as needed for our business records or as required by law (for example, tax rules). After that we
      delete it.
    </p>,
  ],
  [
    "Your rights under the Data Privacy Act of 2012 (RA 10173)",
    <ul key="e" className="list-disc space-y-1 pl-5">
      <li>To be informed about how your data is used (this notice).</li>
      <li>To see the data we hold about you, and to get a copy.</li>
      <li>To correct wrong or outdated data (you can edit your name and number in your Profile).</li>
      <li>To object to processing, or to ask us to delete your data, unless we must keep it by law.</li>
      <li>To file a complaint with the National Privacy Commission.</li>
    </ul>,
  ],
  [
    "Consent",
    <p key="f">When you register, we ask you to agree to this notice before we collect any personal data. We record the date and time you agreed.</p>,
  ],
  [
    "Contact us",
    <p key="g">
      Afable&apos;s Jewelry Store, Montalban Public Market, Rodriguez, Rizal · 0917 123 4500 · hello@afables.ph. Visit the store or message us to use any of
      your rights.
    </p>,
  ],
];

/** FR-45 — plain-English Data Privacy Notice. */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-medium tracking-wide text-gold-dark uppercase">Data privacy</p>
      <h1 className="mt-1 text-4xl sm:text-5xl">Privacy Notice</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        This notice explains, in plain language, what personal data Afable&apos;s Jewelry Store collects through AURELIUS, why, and what your rights are.
      </p>
      <div className="mt-8 space-y-8">
        {sections.map(([title, body]) => (
          <section key={title} className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="text-2xl">{title}</h2>
            <div className="mt-2 text-ink/85">{body}</div>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Last updated for the AURELIUS demo (Phase 1).</p>
    </article>
  );
}
