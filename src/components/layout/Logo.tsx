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
 * The store logo (docs/design/DESIGN.md §3): diamond mark + "AFABLE" in the display face with wide
 * spacing, and "JEWELRY STORE" in small spaced capitals underneath. The accessible name is the full
 * store name.
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
  const sm = size === "sm";
  return (
    <Link href={href} aria-label={brand.name} className={cn("inline-flex items-center gap-2.5 text-black no-underline", className)}>
      <DiamondMark className={cn("mt-1 shrink-0", sm ? "size-5" : "size-6")} />
      <span className="flex flex-col items-center leading-none" aria-hidden>
        <span className={cn("font-heading font-medium tracking-[0.32em]", sm ? "text-xl" : "text-2xl")}>AFABLE</span>
        <span className={cn("mt-1.5 font-sans font-medium tracking-[0.38em] text-grey-700", sm ? "text-[8px]" : "text-[9px]")}>JEWELRY STORE</span>
      </span>
    </Link>
  );
}
