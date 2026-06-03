import 'server-only';

import { z } from 'zod';

const requiredText = z.string().trim().min(1, 'This value is required');

const envSchema = z.object({
  // Supabase needs the public project URL plus both client and service keys.
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: requiredText,
  SUPABASE_SERVICE_ROLE_KEY: requiredText,
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredText,
  ADMIN_SECRET_KEY: requiredText,
  NEXT_PUBLIC_ADMIN_SECRET_KEY: requiredText,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedIssues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment variables:\n${formattedIssues}`);
}

export type Env = z.infer<typeof envSchema>;

// The parsed object is fully typed, so downstream code gets string fields without extra guards.
export const env: Env = parsedEnv.data;