"use client";

import { Suspense } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequireOwner } from "@/components/layout/Guards";
import { LoadingState } from "@/components/shared/States";

/** /admin/* — owner only (FR-46). Phase 2 also enforces this with Supabase RLS. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingState rows={4} className="p-6" />}>
      <RequireOwner>{(user) => <AdminShell user={user}>{children}</AdminShell>}</RequireOwner>
    </Suspense>
  );
}
