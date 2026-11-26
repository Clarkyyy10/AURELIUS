import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

/** Faceted diamond mark. Monochrome, takes the current text colour. */
export function DiamondMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6", className)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M6.5 4h11l4 5-9.5 11L2.5 9Z" />
      <path d="M2.5 9h19M9 4 7.5 9 12 20l4.5-11L15 4M7.5 9 12 4l4.5 5" />
    </svg>
  );
}

/** Kept for older call sites (auth pages): same mark as the logo. */
export const RingGlyph = DiamondMark;

/**
 * The store logo: "AFABLE" in the display face with wide letter spacing. The accessible name is the
 * full store name, so screen readers still hear "Afable's Jewelry Store".
 */
export function Logo({
  href = "/",
  className,
  size = "md",
}: {
  href?: string;
  className?: string;
  size?: "md" | "sm";
  tone?: "dark" | "light";
  subline?: boolean;
}) {
  return (
    <Link href={href} aria-label={brand.name} className={cn("inline-flex items-center text-black no-underline", className)}>
      <span aria-hidden className={cn("font-heading leading-none font-medium tracking-[0.32em]", size === "sm" ? "text-xl" : "text-2xl")}>
        AFABLE
      </span>
    </Link>
  );
}
