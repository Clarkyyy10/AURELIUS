import Link from "next/link";
import { brand } from "@/config/brand";

// The only place that styles the brand name (DESIGN.md section 3). A logo
// replaces this component's contents later. The full name stays in the
// accessible name.
export function Wordmark() {
  return (
    <Link
      href="/"
      className="font-display text-2xl leading-8 font-medium tracking-normal text-foreground"
    >
      {brand.name}
    </Link>
  );
}
