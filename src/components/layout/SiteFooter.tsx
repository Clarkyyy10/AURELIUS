"use client";

import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { useSettings } from "@/lib/data/hooks";
import { Logo } from "./Logo";

export function SiteFooter() {
  const settings = useSettings();
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{settings.claimingNote}</p>
        </div>
        <address className="space-y-2 text-sm not-italic">
          <p className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden /> {settings.address}
          </p>
          <p className="flex gap-2">
            <Phone className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden />
            <a href={`tel:${settings.contactNumber}`} className="hover:underline">
              {settings.contactNumber}
            </a>
          </p>
        </address>
        <p className="flex gap-2 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-gold-dark" aria-hidden /> {settings.openingHours}
        </p>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
          <Link href="/shop" className="hover:underline">
            Shop
          </Link>
          <Link href="/customize" className="hover:underline">
            Design your piece
          </Link>
          <Link href="/services" className="hover:underline">
            Services
          </Link>
          <Link href="/privacy" className="text-gold-dark hover:underline">
            Privacy Notice
          </Link>
        </nav>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings.storeName}. AURELIUS capstone project.
      </p>
    </footer>
  );
}
