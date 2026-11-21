import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

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
