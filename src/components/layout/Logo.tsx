import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

/** Decorative ring mark (kept for the sign-in card). Monochrome, takes the current text colour. */
export function RingGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", className)} fill="none">
      <ellipse cx="12" cy="14" rx="7" ry="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 6.5 12 3l2.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The wordmark (docs/design/DESIGN.md §3): "Afable's Jewelry Store" in the display face, weight 500,
 * black on white, no tracking — a plain stand-in until the owner provides a logo. This is the only
 * place that styles the brand name; a logo later replaces only this component.
 */
export function Logo({ href = "/", className }: { href?: string; tone?: "dark" | "light"; subline?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("font-heading text-xl leading-7 font-medium text-black no-underline sm:text-2xl sm:leading-8", className)}>
      {brand.name}
    </Link>
  );
}
