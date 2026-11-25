"use client";

import { LoadingState } from "@/components/shared/States";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/layout/AuthCard";
import { Field, FormError } from "@/components/shared/Field";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage } from "@/lib/data/hooks";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { toast } from "sonner";
import { Turnstile } from "@/components/shared/Turnstile";
import { IS_API } from "@/lib/data/source";

/** FR-42 — sign in. Phase 1 demo: any password of 8+ characters. Phase 2: Supabase Auth + Turnstile + lockout. */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const idle = params.get("reason") === "idle";
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await repos.auth.login(values.email, values.password, captcha ?? undefined);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}.`);
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? (user.role === "owner" ? "/admin" : "/account"));
    } catch (e) {
      setError(errorMessage(e));
      setCaptchaReset((n) => n + 1); // each security-check token works once
    }
  });

  return (
    <AuthCard
      title="Sign in"
      description={next ? "Sign in to continue." : "Sign in to order, send requests and see your orders, designs and service requests."}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {idle && !error && (
          <p className="border border-black px-3 py-2 text-sm" role="status">
            Your session ended after 30 minutes without activity. Sign in to continue.
          </p>
        )}
        <FormError message={error} />
        <Field label="Email address" required error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" required error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input type={show ? "text" : "password"} autoComplete="current-password" className="pr-11" {...form.register("password")} />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Turnstile onToken={setCaptcha} resetKey={captchaReset} />
        <Button type="submit" size="lg" className="rounded-none px-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Spinner /> Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      <p className="mt-10 flex flex-wrap gap-4 text-[15px]">
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot your password?
        </Link>
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline underline-offset-4">
          Create an account
        </Link>
      </p>

      {!IS_API && (
        <div className="mt-12 border border-dashed border-grey-600 p-4 text-[15px]">
          <p className="font-semibold">Preview sample accounts</p>
          <p className="mt-1 text-grey-700">Pick one to fill in the form. Any password with 8 or more characters works.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["Customer", "maria@demo.ph"],
              ["Owner", "owner@afables.ph"],
              ["Unverified customer", "ana@demo.ph"],
            ].map(([label, email]) => (
              <Button
                key={email}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => form.reset({ email, password: "demo1234" })}
              >
                {label}: {email}
              </Button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-3xl p-6" />}>
      <LoginForm />
    </Suspense>
  );
}
