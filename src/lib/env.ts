import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'VITE_SUPABASE_ANON_KEY looks too short to be valid'),
});

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  // Never log the values themselves — only the field names that failed.
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(
    `Invalid or missing environment variables: ${missing}. ` +
      'Check your .env.local file against .env.example.',
  );
}

export const env = parsed.data;