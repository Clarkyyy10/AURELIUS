"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/shared/Notifications";
import { repos } from "@/lib/data";
import { useCurrentUser } from "@/lib/data/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Logo } from "./Logo";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/customize", label: "Customize" },
  { href: "/services", label: "Services" },
  { href: "/track", label: "Track" },
];

const linkClass = "text-[17px] leading-6 text-black underline-offset-[6px] decoration-1 hover:underline";

/** Site header (DESIGN.md §10): logo left, plain text links right; the current page is underlined. */
export function SiteHeader() {
  const { user, ready } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await repos.auth.logout();
    toast.success("You are signed out.");
    router.push("/");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const authActive = ["/login", "/register", "/forgot-password", "/reset-password"].some((p) => pathname.startsWith(p));
  const accountHref = user?.role === "owner" ? "/admin" : "/account";
  const accountLabel = user?.role === "owner" ? "Owner" : "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-grey-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Main">
          {nav.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={cn(linkClass, isActive(l.href) && "underline")}>
              {l.label}
            </Link>
          ))}
          {ready && !user && (
            <Link href="/login" aria-current={authActive ? "page" : undefined} className={cn(linkClass, authActive && "underline")}>
              Sign in
            </Link>
          )}
          {ready && user && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(linkClass, "rounded-sm", (isActive("/account") || isActive("/admin")) && "underline")}>
                {accountLabel}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate">{user.fullName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={accountHref}>{user.role === "owner" ? "Owner dashboard" : "My account"}</Link>
                </DropdownMenuItem>
                {user.role === "customer" && (
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile">Profile</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void logout()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className={cn("flex items-center gap-1", "ml-auto md:ml-2")}>
          {ready && user && <NotificationBell user={user} />}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs">
              <SheetHeader>
                <SheetTitle className="font-heading text-2xl">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-4" aria-label="Mobile">
                {[...nav, ...(user ? [{ href: accountHref, label: user.role === "owner" ? "Owner dashboard" : "My account" }] : [])].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cn("flex min-h-12 items-center border-b border-grey-200 text-lg", isActive(l.href) && "underline underline-offset-[6px]")}
                  >
                    {l.label}
                  </Link>
                ))}
                {user ? (
                  <button
                    type="button"
                    className="flex min-h-12 items-center text-left text-lg"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-lg">
                    Sign in
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
