import { z } from 'zod';

/**
 * The ONLY module that reads `import.meta.env` (enforced by ESLint). Everything prefixed `VITE_` is
 * bundled into the client and is public, so this schema must never hold secrets.
 */
const EnvSchema = z.object({
  VITE_API_BASE_URL: z
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'VITE_API_BASE_URL must use https',
    })
    .default('https://fakestoreapi.com'),
  BASE_URL: z.string().default('/'),
  MODE: z.string().default('production'),
  DEV: z.boolean().default(false),
});

export interface AppEnv {
  /** API origin without a trailing slash. */
  readonly apiBaseUrl: string;
  /** Public path the app is served from, always ending in a slash. */
  readonly basePath: string;
  readonly isDev: boolean;
  readonly isTest: boolean;
}

export function parseEnv(raw: Record<string, unknown>): AppEnv {
  const parsed = EnvSchema.parse(raw);
  return {
    apiBaseUrl: parsed.VITE_API_BASE_URL.replace(/\/+$/, ''),
    basePath: parsed.BASE_URL.endsWith('/') ? parsed.BASE_URL : `${parsed.BASE_URL}/`,
    isDev: parsed.DEV,
    isTest: parsed.MODE === 'test',
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
