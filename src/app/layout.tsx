import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";
import { brand } from "@/config/brand";
// Name-pendant fonts (SIL OFL / Apache 2.0), bundled locally. Files load only when used.
import "@fontsource/great-vibes/latin-400.css";
import "@fontsource/dancing-script/latin-700.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/pacifico/latin-400.css";
import "@fontsource/allura/latin-400.css";
import "@fontsource/alex-brush/latin-400.css";
import "@fontsource/parisienne/latin-400.css";
import "@fontsource/lobster/latin-400.css";
import "@fontsource/satisfy/latin-400.css";
import "@fontsource/cinzel/latin-700.css";
import "@fontsource/cormorant-garamond/latin-700.css";

// DESIGN.md §5: Cormorant Garamond 500 for headings and the wordmark, Inter for body and UI. The
// "latin-ext" subset is needed for the peso sign (U+20B1).
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], display: "swap" });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s | ${brand.name}` },
  description: brand.description,
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
