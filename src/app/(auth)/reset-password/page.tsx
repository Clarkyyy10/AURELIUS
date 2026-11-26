"use client";

import { LoadingState } from "@/components/shared/States";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field, FormError } from "@/components/shared/Field";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage } from "@/lib/data/hooks";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import type { z } from "zod";

/** FR-43 — choose a new password from the emailed link (expires in 1 hour). */
function ResetPassword() {
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token)
    return (
      <AuthCard title="This link is incomplete">
        <p className="text-muted-foreground">Open the reset link from your email again, or request a new one.</p>
        <Button asChild className="mt-6">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );

  if (done)
    return (
      <AuthCard title="Your password was changed">
        <CheckCircle2 className="mb-3 size-10 text-success" aria-hidden />
        <p className="text-muted-foreground">You can now sign in with your new password.</p>
        <Button asChild className="mt-6">
          <Link href="/login">Sign in</Link>
        </Button>
      </AuthCard>
    );

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await repos.auth.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthCard title="Choose a new password" description="Reset links expire 1 hour after they are sent.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        {error && (
          <Link href="/forgot-password" className="block text-sm text-gold-dark hover:underline">
            Request a new link
          </Link>
        )}
        <Field label="New password" hint="At least 8 characters." error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirm new password" error={form.formState.errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        </Field>
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />} Save new password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-3xl p-6" />}>
      <ResetPassword />
    </Suspense>
  );
}
