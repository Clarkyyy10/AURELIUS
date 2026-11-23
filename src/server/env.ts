// Server configuration. Fails with a clear message when a required value is missing.

export function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing environment variable ${name}. Add it to .env.local (see .env.example) or to the Vercel project settings.`);
  return v;
}

export const optionalEnv = (name: string): string | undefined => process.env[name]?.trim() || undefined;

export const isProduction = () => process.env.NODE_ENV === "production";

/** Public site address used in email links, e.g. https://aurelius.example.com */
export const siteUrl = () => (optionalEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, "");
