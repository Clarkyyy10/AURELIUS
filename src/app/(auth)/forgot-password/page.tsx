"use client";

import { Suspense, useState } from "react";
import { LoadingState } from "@/components/shared/States";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field, FormError } from "@/components/shared/Field";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage } from "@/lib/data/hooks";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import type { z } from "zod";
import { useSearchParams } from "next/navigation";
import { Turnstile } from "@/components/shared/Turnstile";
import { IS_API } from "@/lib/data/source";

/** FR-43 — request a time-limited reset link. */
function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const expired = useSearchParams().get("expired") === "1";
  const form = useForm<z.input<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await repos.auth.requestPasswordReset(email, captcha ?? undefined);
      setSentTo(email);
    } catch (e) {
      setError(errorMessage(e));
      setCaptchaReset((n) => n + 1);
    }
  });

  if (sentTo)
    return (
      <AuthCard title="Check your email">
        <MailCheck className="mb-3 size-10 text-gold" aria-hidden />
        <p className="text-muted-foreground">
          If an account exists for <strong className="text-ink">{sentTo}</strong>, we sent a link to reset your password. The link expires in 1 hour.
        </p>
        {!IS_API && (
          <p className="mt-3 rounded-lg bg-gold/10 p-3 text-sm">
            <strong>Demo mode:</strong> open <strong>“Simulated emails”</strong> in the bar at the top and click <strong>Choose a new password</strong>.
          </p>
        )}
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Back to log in</Link>
        </Button>
      </AuthCard>
    );

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Link href="/login" className="text-gold-dark hover:underline">
          Back to log in
        </Link>
      }
    >
      {expired && !error && (
        <p className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm" role="status">
          That reset link has expired or was already used. Ask for a new one below.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <Field label="Email address" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Turnstile onToken={setCaptcha} resetKey={captchaReset} />
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />} Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingState rows={2} label="Loading…" className="py-8" />}>
      <ForgotPassword />
    </Suspense>
  );
}
