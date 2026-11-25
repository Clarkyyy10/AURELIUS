import { z } from "zod";

const requiredText = z.string().min(1);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredText,
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: requiredText,
  DATABASE_URL: requiredText,
  DIRECT_URL: requiredText,
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
