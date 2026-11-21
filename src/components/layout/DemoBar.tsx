"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, FlaskConical, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DateText } from "@/components/shared/Text";
import { clearFiles } from "@/lib/data/mock/fileStore";
import { useDemoStore } from "@/lib/data/mock/store";
import { MARIA_ID, OWNER_ID } from "@/lib/data/seed/catalog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLLAPSE_KEY = "aurelius-demo-bar-collapsed";
const listeners = new Set<() => void>();
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function setCollapsedStored(v: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/**
 * Phase 1 only — lets testers switch between Guest, Customer and Owner, read simulated emails,
 * simulate errors, and reset the demo data (frontend-spec §2).
 */
export function DemoBar() {
  const router = useRouter();
  const collapsed = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readCollapsed,
    () => false,
  );
  const hydrated = useDemoStore((s) => s.hydrated);
  const sessionUserId = useDemoStore((s) => s.sessionUserId);
  const users = useDemoStore((s) => s.users);
  const emails = useDemoStore((s) => s.emails);
  const simulateErrors = useDemoStore((s) => s.simulateErrors);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const current = users.find((u) => u.id === sessionUserId);
  const otherCustomer = current && current.role === "customer" && current.id !== MARIA_ID ? current : null;

  const switchTo = (userId: string | null) => {
    useDemoStore.getState().write((d) => {
      d.sessionUserId = userId;
    });
    const target = users.find((u) => u.id === userId);
    toast.success(target ? `Now viewing as ${target.role === "owner" ? "the owner" : target.fullName}.` : "Now viewing as a guest.");
    if (target?.role === "owner") router.push("/admin");
    else if (window.location.pathname.startsWith("/admin")) router.push("/");
  };

  const roleButton = (label: string, userId: string | null, active: boolean) => (
    <button
      type="button"
      onClick={() => switchTo(userId)}
      aria-pressed={active}
      className={cn(
        "min-h-8 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
        active ? "bg-gold text-ink" : "text-ivory/80 hover:bg-white/10 hover:text-ivory",
      )}
    >
      {label}
    </button>
  );

  if (collapsed) {
    return (
      <div className="flex justify-end bg-ink px-3 text-ivory">
        <button type="button" onClick={() => setCollapsedStored(false)} className="flex min-h-7 items-center gap-1 text-xs text-ivory/80 hover:text-ivory">
          <FlaskConical className="size-3.5" aria-hidden /> Demo mode <ChevronDown className="size-3.5" aria-hidden />
          <span className="sr-only">Show the demo bar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-ink text-ivory" role="region" aria-label="Demo mode controls">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-xs sm:px-4">
        <span className="flex items-center gap-1.5 font-medium text-gold">
          <FlaskConical className="size-3.5" aria-hidden /> Demo mode
        </span>
        <span className="text-ivory/70">viewing as:</span>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Choose who you are viewing as">
          {roleButton("Guest", null, hydrated && !current)}
          {roleButton("Customer: Maria Santos", MARIA_ID, sessionUserId === MARIA_ID)}
          {otherCustomer && roleButton(`Customer: ${otherCustomer.fullName}`, otherCustomer.id, true)}
          {roleButton("Owner", OWNER_ID, sessionUserId === OWNER_ID)}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Sheet open={emailsOpen} onOpenChange={setEmailsOpen}>
            <SheetTrigger asChild>
              <button type="button" className="flex min-h-8 items-center gap-1 rounded-md px-2 hover:bg-white/10">
                <Mail className="size-3.5" aria-hidden /> Simulated emails ({emails.length})
              </button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="font-heading text-2xl">Simulated emails</SheetTitle>
                <SheetDescription>
                  In Phase 1 no real emails are sent. Every email the system would send appears here, newest first.
                </SheetDescription>
              </SheetHeader>
              <ul className="space-y-3 px-4 pb-6">
                {emails.length === 0 && <li className="text-sm text-muted-foreground">No emails yet. Register, reset a password, or trigger a customer notification.</li>}
                {emails.map((m) => (
                  <li key={m.id} className="rounded-xl border border-line bg-paper p-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      To {m.to} · <DateText value={m.createdAt} relative />
                    </p>
                    <p className="mt-1 font-medium">{m.subject}</p>
                    <p className="mt-1 text-muted-foreground">{m.body}</p>
                    {m.link && (
                      <Button asChild size="sm" className="mt-2">
                        <Link href={m.link} onClick={() => setEmailsOpen(false)}>
                          {m.linkLabel ?? "Open link"}
                        </Link>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>

          <label className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 hover:bg-white/10">
            <Switch checked={simulateErrors} onCheckedChange={(v) => useDemoStore.getState().setSimulateErrors(v)} aria-label="Simulate errors" className="scale-75" />
            Simulate errors
          </label>

          <ConfirmDialog
            trigger={
              <button type="button" className="flex min-h-8 items-center gap-1 rounded-md px-2 hover:bg-white/10">
                <RotateCcw className="size-3.5" aria-hidden /> Reset demo data
              </button>
            }
            title="Reset the demo data?"
            description="This removes everything you've added (orders, requests, uploads, accounts) and restores the sample data. You'll be signed out."
            confirmLabel="Reset demo data"
            destructive
            onConfirm={async () => {
              useDemoStore.getState().reset();
              await clearFiles().catch(() => undefined);
              try {
                sessionStorage.removeItem("aurelius-chat");
              } catch {
                /* ignore */
              }
              toast.success("Demo data was reset.");
              router.push("/");
            }}
          />

          <button type="button" onClick={() => setCollapsedStored(true)} className="flex min-h-8 items-center rounded-md px-1.5 hover:bg-white/10" aria-label="Hide the demo bar">
            <ChevronUp className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
