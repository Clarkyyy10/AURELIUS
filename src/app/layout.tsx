import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";
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

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "AURELIUS by Afable's Jewelry Store", template: "%s · AURELIUS" },
  description:
    "Design your piece in 3D, order from our collection, or book a repair at Afable's Jewelry Store in Montalban.",
};

export const viewport: Viewport = { themeColor: "#FAF7F2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
