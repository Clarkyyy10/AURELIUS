"use client";

import { LoadingState } from "@/components/shared/States";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/layout/AuthCard";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage, useCurrentUser } from "@/lib/data/hooks";
import { useDemoStore } from "@/lib/data/mock/store";
import { toast } from "sonner";

/** FR-41 — "check your inbox" screen, and the page the confirmation link opens. */
function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token");
  const next = params.get("next");
  const { user } = useCurrentUser();
  const hydrated = useDemoStore((s) => s.hydrated);
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (!token || !hydrated) return;
    let cancelled = false;
    repos.auth.verifyEmail(token).then(
      () => !cancelled && setResult({ ok: true }),
      (e) => !cancelled && setResult({ ok: false, message: errorMessage(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [token, hydrated]);

  if (token) {
    if (!result)
      return (
        <AuthCard title="Confirming your email…">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner /> Please wait a moment.
          </p>
        </AuthCard>
      );
    return result.ok ? (
      <AuthCard title="Your email is confirmed">
        <CheckCircle2 className="mb-3 size-10 text-success" aria-hidden />
        <p className="text-muted-foreground">Thank you. You can now place orders, submit custom designs, and book services.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={next && next.startsWith("/") ? next : "/customize"}>{next ? "Continue where you left off" : "Design your piece"}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">Go to my account</Link>
          </Button>
        </div>
      </AuthCard>
    ) : (
      <AuthCard title="We couldn't confirm your email">
        <XCircle className="mb-3 size-10 text-danger" aria-hidden />
        <p className="text-muted-foreground">{result.message}</p>
        <Button asChild className="mt-6">
          <Link href="/login">Log in</Link>
        </Button>
      </AuthCard>
    );
  }

  const email = params.get("email") ?? user?.email;
  return (
    <AuthCard title="Check your email" description={email ? <>We sent a confirmation link to <strong className="text-ink">{email}</strong>.</> : "We sent you a confirmation link."}>
      <MailCheck className="mb-3 size-10 text-gold" aria-hidden />
      <p className="text-muted-foreground">Open the email and click the link to confirm your address. You need to do this before you can place orders or submit requests.</p>
      <p className="mt-3 rounded-lg bg-gold/10 p-3 text-sm">
        <strong>Demo mode:</strong> no real email is sent. Open <strong>“Simulated emails”</strong> in the dark bar at the top of the page and click <strong>Verify my email</strong>.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {user && !user.emailVerified && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await repos.auth.resendVerification();
                toast.success("We sent a new confirmation link.");
              } catch (e) {
                toast.error(errorMessage(e));
              }
            }}
          >
            Resend the link
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href="/">Browse the store</Link>
        </Button>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-3xl p-6" />}>
      <VerifyEmail />
    </Suspense>
  );
}
