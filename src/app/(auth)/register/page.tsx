"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field, FormError } from "@/components/shared/Field";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage } from "@/lib/data/hooks";
import { registerSchema, type RegisterInput } from "@/lib/validation/schemas";

function strength(pw: string): { label: string; score: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return { score, label: ["Too short", "Okay", "Good", "Strong", "Very strong"][score] };
}

/** FR-41 registration + FR-45 privacy notice and consent. */
function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", contactNumber: "", password: "", confirmPassword: "", privacyConsent: false },
  });
  const { errors } = form.formState;
  const consent = useWatch({ control: form.control, name: "privacyConsent" });
  const pw = strength(useWatch({ control: form.control, name: "password" }) ?? "");

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const parsed = registerSchema.parse(values);
      await repos.auth.register(parsed);
      const qs = new URLSearchParams({ email: parsed.email, ...(next ? { next } : {}) });
      router.push(`/verify-email?${qs}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthCard
      title="Create your account"
      description="Register to place orders, submit custom designs, and book services."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-gold-dark hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <Field label="Full name" error={errors.fullName?.message}>
          <Input autoComplete="name" {...form.register("fullName")} />
        </Field>
        <Field label="Email address" error={errors.email?.message} hint="We'll send a confirmation link to this address.">
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Mobile number" error={errors.contactNumber?.message} hint="For example 09171234567. The owner uses this to contact you about your orders.">
          <Input type="tel" inputMode="tel" autoComplete="tel" {...form.register("contactNumber")} />
        </Field>
        <Field label="Password" error={errors.password?.message} hint={`At least 8 characters. Strength: ${pw.label}.`}>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <div className="-mt-2 flex gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${pw.score >= i ? (pw.score >= 3 ? "bg-success" : "bg-warning") : "bg-line"}`} />
          ))}
        </div>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>

        <section aria-labelledby="privacy-summary" className="rounded-xl border border-line bg-ivory">
          <h2 id="privacy-summary" className="px-4 pt-3 font-sans text-sm font-semibold">
            Privacy Notice (summary)
          </h2>
          <div className="max-h-36 overflow-y-auto px-4 pt-1 pb-3 text-sm text-muted-foreground" tabIndex={0}>
            <p>
              We collect your name, email address, and mobile number, plus the details of your orders, designs, service requests, and payment proofs. We use them only to process your orders and requests and to contact you about them.
            </p>
            <p className="mt-2">
              Only you and the store owner can see your personal data. We keep it while your account is active and as required by law. Under the Data Privacy Act of 2012 (RA 10173) you can ask to see, correct, or delete your data.
            </p>
            <p className="mt-2">
              Read the full{" "}
              <Link href="/privacy" target="_blank" className="text-gold-dark underline">
                Privacy Notice
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="space-y-1">
          <div className="flex items-start gap-3">
            <Controller
              control={form.control}
              name="privacyConsent"
              render={({ field }) => (
                <Checkbox
                  id="privacyConsent"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  aria-invalid={Boolean(errors.privacyConsent)}
                  aria-describedby={errors.privacyConsent ? "privacyConsent-error" : undefined}
                  className="mt-0.5 size-5"
                />
              )}
            />
            <label htmlFor="privacyConsent" className="text-sm leading-snug">
              I have read the Privacy Notice and agree to the collection and use of my personal data for my orders and requests.
            </label>
          </div>
          {errors.privacyConsent && (
            <p id="privacyConsent-error" className="text-sm text-danger" role="alert">
              {errors.privacyConsent.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={!consent || form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />} Create account
        </Button>
        {!consent && <p className="text-center text-xs text-muted-foreground">Tick the box above to agree to the Privacy Notice and continue.</p>}
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
