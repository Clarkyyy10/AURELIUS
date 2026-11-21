import Link from "next/link";
import { cn } from "@/lib/utils";

export function RingGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-5", className)} fill="none">
      <ellipse cx="12" cy="14" rx="7" ry="7.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 6.5 12 3l2.5 3.5Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = "/", tone = "dark", subline = true }: { href?: string; tone?: "dark" | "light"; subline?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 rounded-md no-underline" aria-label="AURELIUS home">
      <RingGlyph className={tone === "dark" ? "text-gold" : "text-gold"} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-xl tracking-[0.2em]", tone === "dark" ? "text-ink" : "text-ivory")}>AURELIUS</span>
        {subline && (
          <span className={cn("mt-0.5 text-[10px] tracking-wide", tone === "dark" ? "text-muted-foreground" : "text-ivory/70")}>
            by Afable&apos;s Jewelry Store
          </span>
        )}
      </span>
    </Link>
  );
}
