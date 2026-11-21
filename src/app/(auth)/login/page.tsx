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

/** FR-42 — log in. Demo: any password of 8+ characters. */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await repos.auth.login(values.email, values.password);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}.`);
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? (user.role === "owner" ? "/admin" : "/account"));
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthCard
      title="Log in"
      description={next ? "Please log in to continue." : "Welcome back to Afable's Jewelry Store."}
      footer={
        <>
          New here?{" "}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold-dark hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <Field label="Email address" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
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
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-gold-dark hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Spinner />} Log in
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-gold/50 bg-gold/5 p-4 text-sm">
        <p className="font-medium">Demo accounts</p>
        <p className="mt-1 text-muted-foreground">Use any password with 8 or more characters.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            ["Customer", "maria@demo.ph"],
            ["Owner", "owner@afables.ph"],
            ["Unverified customer", "ana@demo.ph"],
          ].map(([label, email]) => (
            <Button key={email} type="button" variant="outline" size="sm" onClick={() => form.reset({ email, password: "demo1234" })}>
              {label}: {email}
            </Button>
          ))}
        </div>
      </div>
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
