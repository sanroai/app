import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('Sanro AI'),
  APP_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z
    .string()
    .optional()
    .default('')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(8).default('dev-only-secret-change-me'),
  AUTH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  AUTH_REFRESH_EXPIRES_IN: z.string().default('30d'),
  AUTH_ISSUER: z.string().default('sanro-api'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'gemini']).default('mock'),
  AI_BASE_URL: z.string().optional().default('https://api.openai.com/v1'),
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  STORAGE_URL: z.string().optional().default(''),
  STORAGE_KEY: z.string().optional().default(''),
  STORAGE_SECRET: z.string().optional().default(''),
  STORAGE_BUCKET: z.string().optional().default(''),
  RATE_LIMIT_TTL_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  PDF_ENGINE: z.enum(['chrome', 'none']).default('chrome'),
  SEED_SUPER_ADMIN_EMAIL: z.string().optional().default(''),
  SEED_SUPER_ADMIN_PASSWORD: z.string().optional().default(''),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}

export const STORAGE_LOCAL_DIR = 'storage';