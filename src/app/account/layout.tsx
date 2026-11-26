"use client";

import { Suspense } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { RequireAuth } from "@/components/layout/Guards";
import { LoadingState } from "@/components/shared/States";

/** /account/* — customers must be signed in (frontend-spec §2). */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<LoadingState />}>
          <RequireAuth>{() => children}</RequireAuth>
        </Suspense>
      </div>
    </SiteShell>
  );
}
