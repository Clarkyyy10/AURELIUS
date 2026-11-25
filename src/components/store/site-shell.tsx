import type { ReactNode } from "react";
import { brand } from "@/config/brand";
import { Wordmark } from "@/components/store/wordmark";

// Base layout shell: header (wordmark), main, footer. DESIGN.md section 10.
// Header height is fixed (64 px mobile, 72 px desktop) so a future logo does
// not shift the layout. No navigation, cart or account link yet: no screens
// exist to link to.
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-background focus:px-4 focus:py-3"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center px-4 sm:px-6 md:px-8 lg:h-18 xl:px-12">
          <Wordmark />
        </div>
      </header>
      <main
        id="main"
        className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 py-12 sm:px-6 md:px-8 lg:py-24 xl:px-12"
      >
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 md:px-8 xl:px-12">
          <p className="type-small text-muted-foreground">{brand.name}</p>
        </div>
      </footer>
    </>
  );
}
