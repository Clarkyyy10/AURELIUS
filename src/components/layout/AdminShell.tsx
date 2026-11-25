"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  ClipboardList,
  CreditCard,
  Gem,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/shared/Notifications";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";
import { ownerCounts, type OwnerCounts } from "@/lib/transactions/ownerCounts";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";
import { Logo } from "./Logo";

const items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: keyof OwnerCounts }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/custom-requests", label: "Custom Requests", icon: Gem, badge: "customToReview" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "ordersToQuote" },
  { href: "/admin/service-requests", label: "Service Requests", icon: Wrench, badge: "servicesToAssess" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, badge: "paymentsToVerify" },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/service-catalog", label: "Service Catalog", icon: ClipboardList },
  { href: "/admin/customization", label: "Customization & Rates", icon: Palette },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/chatbot", label: "Chatbot Knowledge", icon: Bot },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function titleFor(pathname: string) {
  const match = [...items].reverse().find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  if (pathname.startsWith("/admin/notifications")) return "Notifications";
  return match?.label ?? "Owner";
}

function SideNav({ counts, onNavigate }: { counts?: OwnerCounts; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Owner" className="flex flex-col gap-0.5 p-3">
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
        const n = badge && counts ? counts[badge] : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium text-grey-700 hover:bg-grey-100 hover:text-black",
              active && "bg-grey-100 font-semibold text-black shadow-[inset_3px_0_0_#000]",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {n > 0 && (
              <span className="rounded-sm bg-black px-2 text-xs leading-5 font-semibold text-white" aria-label={`${n} need action`}>
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Owner shell: white sidebar, top bar with title, bell (FR-50) and "View store". */
export function AdminShell({ user, children }: { user: UserProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const q = useQuery("admin-counts", async () => ownerCounts(await repos.transactions.listAll()));

  return (
    <div className="flex min-h-[calc(100vh-2.25rem)] flex-1">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-grey-200 bg-white text-black lg:flex">
        <div className="border-b border-sidebar-border px-5 py-4">
          <Logo href="/admin" tone="light" />
          <p className="mt-1 text-xs text-grey-600">Owner dashboard</p>
        </div>
        <SideNav counts={q.data} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-paper px-3 sm:px-5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open owner menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Owner menu</SheetTitle>
              <div className="border-b border-sidebar-border px-5 py-4">
                <Logo href="/admin" tone="light" />
              </div>
              <SideNav counts={q.data} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="truncate font-heading text-xl font-semibold">{titleFor(pathname)}</p>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/">
                <Store className="size-4" /> View store
              </Link>
            </Button>
            <NotificationBell user={user} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log out"
              onClick={async () => {
                await repos.auth.logout();
                router.push("/");
              }}
            >
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
