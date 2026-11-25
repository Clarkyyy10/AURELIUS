import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SaveIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { StatusBadge } from "@/components/store/status-badge";
import { statusKeys } from "@/components/store/status-treatment";

// Development-only page for checking the design system primitives by eye.
// It returns a 404 in production. It is not a feature screen.
export const metadata: Metadata = {
  title: "Primitives (development only)",
  robots: { index: false, follow: false },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="type-heading">{title}</h2>
      {children}
    </section>
  );
}

export default function PrimitivesPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-12">
      <h1 className="type-display">Primitives</h1>

      <Section title="Type and peso sign">
        <p className="type-display">Display: Afable&apos;s Jewelry Store</p>
        <p className="type-heading">Heading: ₱12,500.00</p>
        <p className="type-title">Title: Plain band ring</p>
        <p className="type-body">
          Body: the quick brown fox jumps over the lazy dog. Mañana. Estimate{" "}
          <span className="type-amount">₱12,500.00</span> (U+20B1, body sans,
          tabular figures).
        </p>
        <p className="type-small">Small: helper text and table cells.</p>
        <p className="type-caption">Caption: badge labels, legal lines.</p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Request a quotation</Button>
          <Button variant="outline">Back</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link button</Button>
          <Button variant="destructive">
            <Trash2Icon data-icon="inline-start" />
            Delete draft
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg">Large call to action</Button>
          <Button size="sm">Compact</Button>
          <Button size="icon" aria-label="Save">
            <SaveIcon />
          </Button>
        </div>
      </Section>

      <Section title="Form">
        <form className="flex max-w-md flex-col gap-6" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dev-name">Full name (required)</FieldLabel>
              <Input id="dev-name" autoComplete="name" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="dev-mobile">
                Mobile number (required)
              </FieldLabel>
              <Input
                id="dev-mobile"
                inputMode="tel"
                aria-invalid
                aria-describedby="dev-mobile-error"
                defaultValue="0917"
              />
              <FieldError id="dev-mobile-error">
                Enter a mobile number with 11 digits, like 09171234567.
              </FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="dev-notes">Notes (optional)</FieldLabel>
              <Textarea id="dev-notes" />
              <FieldDescription>
                Tell us anything the store should know.
              </FieldDescription>
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="dev-disabled">Reference number</FieldLabel>
              <Input id="dev-disabled" disabled />
              <FieldDescription>Upload a proof first.</FieldDescription>
            </Field>
            <FieldSet>
              <FieldLegend>Group legend</FieldLegend>
              <FieldDescription>Related fields share a set.</FieldDescription>
            </FieldSet>
          </FieldGroup>
          <Button type="button">Save</Button>
        </form>
      </Section>

      <Section title="Status badges">
        <div className="flex flex-col items-start gap-3">
          {statusKeys.map((key) => (
            <StatusBadge
              key={key}
              status={key}
              reason={
                key === "rejected" || key === "proof-rejected"
                  ? "The reference number does not match."
                  : undefined
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="cancelled">Cancelled</Badge>
          <Badge variant="expired">Expired</Badge>
          <Badge size="sm">Small neutral</Badge>
        </div>
      </Section>
    </div>
  );
}
