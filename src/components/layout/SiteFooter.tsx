import Link from "next/link";
import { Logo } from "./Logo";

/** Footer (DESIGN.md §10): logo on the left, policy links on the right. */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-grey-200 bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo size="sm" />
        <nav aria-label="Footer" className="flex flex-wrap gap-6 text-sm">
          <Link href="/privacy" className="text-grey-700 underline underline-offset-4 hover:text-black">
            Privacy notice
          </Link>
          <Link href="/credits" className="text-grey-700 underline underline-offset-4 hover:text-black">
            Photo credits
          </Link>
        </nav>
      </div>
    </footer>
  );
}
