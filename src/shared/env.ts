import { z } from "zod";

const requiredText = z.string().min(1);

// .env.example ships empty values (KEY=). An empty optional value counts as unset.
const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.email().optional(),
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredText,
  // Optional until the Cloudflare Turnstile keys exist.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalText,
});

// Server variables include the public ones. Gemini, Resend and Turnstile are
// optional until their accounts exist, so the app builds and tests without them.
const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredText,
  DATABASE_URL: requiredText,
  DIRECT_URL: requiredText,
  GEMINI_API_KEY: optionalText,
  RESEND_API_KEY: optionalText,
  RESEND_FROM_EMAIL: optionalEmail,
  TURNSTILE_SECRET_KEY: optionalText,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
type EnvSource = Record<string, string | undefined>;

export function parsePublicEnv(source: EnvSource): PublicEnv {
  return publicEnvSchema.parse(source);
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  return serverEnvSchema.parse(source);
}

// Next.js inlines NEXT_PUBLIC_ values only when they are written out in full,
// so each one is read by name here instead of passing process.env along.
export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}
