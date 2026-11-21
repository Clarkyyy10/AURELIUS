"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, User, UserCircle } from "lucide-react";
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
];

export function SiteHeader() {
  const { user, ready } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = user?.role === "customer" ? [...nav, { href: "/account", label: "My Account" }] : user?.role === "owner" ? [...nav, { href: "/admin", label: "Owner dashboard" }] : nav;

  const logout = async () => {
    await repos.auth.logout();
    toast.success("You're logged out.");
    router.push("/");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-ink/80 hover:bg-muted hover:text-ink",
                isActive(l.href) && "text-gold-dark underline decoration-gold decoration-2 underline-offset-8",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {ready && user && <NotificationBell user={user} />}
          {ready && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Account menu for ${user.fullName}`} className="hidden md:inline-flex">
                  <UserCircle className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate">{user.fullName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "owner" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard /> Owner dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account/profile">
                        <User /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <LayoutDashboard /> My Account
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void logout()}>
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {ready && !user && (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}

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
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cn("rounded-lg px-3 py-3 text-base font-medium hover:bg-muted", isActive(l.href) && "bg-muted text-gold-dark")}
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-line" />
                {user ? (
                  <>
                    {user.role === "customer" && (
                      <Link href="/account/profile" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-base hover:bg-muted">
                        Profile
                      </Link>
                    )}
                    <button
                      type="button"
                      className="rounded-lg px-3 py-3 text-left text-base hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        void logout();
                      }}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-base hover:bg-muted">
                      Log in
                    </Link>
                    <Button asChild className="mt-1">
                      <Link href="/register" onClick={() => setMenuOpen(false)}>
                        Register
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
