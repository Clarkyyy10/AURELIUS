"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MailWarning, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage, useCurrentUser } from "@/lib/data/hooks";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

function useLoginRedirect(active: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!active) return;
    const next = pathname + (search.toString() ? `?${search}` : "");
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [active, pathname, search, router]);
}

/** Pages under /account and checkout steps: must be signed in (frontend-spec §2). */
export function RequireAuth({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const { user, ready } = useCurrentUser();
  useLoginRedirect(ready && !user);
  if (!ready || !user) return <LoadingState rows={3} label="Checking your sign-in…" className="py-8" />;
  return <>{children(user)}</>;
}

/** Pages under /admin: owner only. Customers see a 403 message. */
export function RequireOwner({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const { user, ready } = useCurrentUser();
  useLoginRedirect(ready && !user);
  if (!ready || !user) return <LoadingState rows={4} label="Checking your sign-in…" className="p-6" />;
  if (user.role !== "owner") return <Forbidden />;
  return <>{children(user)}</>;
}

export function Forbidden() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <ShieldAlert className="mb-4 size-10 text-gold-dark" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">Error 403</p>
      <h1 className="mt-1 text-3xl">This page is for the store owner.</h1>
      <p className="mt-2 text-muted-foreground">You&apos;re signed in as a customer, so you can&apos;t open owner pages. Go to your account to see your orders and requests.</p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/account">Go to my account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to the store</Link>
        </Button>
      </div>
    </div>
  );
}

/** FR-41 banner: shown when the customer hasn't verified their email yet. */
export function VerifyEmailBanner({ user, action = "place orders or submit requests" }: { user: UserProfile; action?: string }) {
  const [sent, setSent] = useState(false);
  if (user.emailVerified || user.role !== "customer") return null;
  return (
    <div role="status" className="flex flex-wrap items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
      <MailWarning className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Please verify your email address</p>
        <p className="text-muted-foreground">
          We sent a confirmation link to <strong>{user.email}</strong>. You need to verify it before you can {action}. (Demo: open “Simulated emails” in the bar at the top.)
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={sent}
        onClick={async () => {
          try {
            await repos.auth.resendVerification();
            setSent(true);
            toast.success("We sent a new confirmation link.");
          } catch (e) {
            toast.error(errorMessage(e));
          }
        }}
      >
        {sent ? "Link sent" : "Resend verification email"}
      </Button>
    </div>
  );
}
