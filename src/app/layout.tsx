import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@/config/brand";
import { fontVariables } from "@/config/fonts";
import { SiteShell } from "@/components/store/site-shell";

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s | ${brand.name}` },
  description: brand.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
