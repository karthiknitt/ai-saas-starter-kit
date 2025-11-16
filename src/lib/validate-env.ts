/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup to catch configuration issues early.
 * Uses Zod for runtime type validation and provides helpful error messages.
 *
 * @module validate-env
 */

import { z } from 'zod';

/**
 * Environment variable schema definition
 *
 * All required environment variables for the application:
 * - Database configuration
 * - Authentication settings
 * - Payment provider (Polar)
 * - Email service (Resend)
 * - Security (Arcjet)
 * - AI providers (optional)
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid database connection URL'),

  // Authentication (Better Auth)
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),

  // Google OAuth (optional for development, required for production)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Payment Provider (Polar)
  POLAR_ACCESS_TOKEN: z
    .string()
    .startsWith('polar_', 'POLAR_ACCESS_TOKEN must start with "polar_"')
    .optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),

  // Email Service (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_SENDER_EMAIL: z.string().email('RESEND_SENDER_EMAIL must be a valid email').optional(),

  // Security (Arcjet)
  ARCJET_KEY: z.string().optional(),

  // API Keys (Optional - users provide their own)
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hexadecimal characters')
    .regex(/^[0-9a-f]{64}$/i, 'ENCRYPTION_KEY must be a 64-character hex string'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validated and typed environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 *
 * @param env - Environment variables object (defaults to process.env)
 * @returns Validated environment variables
 * @throws {Error} If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * // In next.config.ts or app startup
 * import { validateEnv } from '@/lib/validate-env';
 *
 * const env = validateEnv();
 * ```
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): Env {
  try {
    const validated = envSchema.parse(env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:\n');

      for (const issue of error.issues) {
        const path = issue.path.join('.');
        console.error(`  - ${path}: ${issue.message}`);
      }

      console.error('\n💡 Tips:');
      console.error('  1. Copy .env.example to .env.local');
      console.error('  2. Fill in all required environment variables');
      console.error('  3. Ensure values match the expected format');
      console.error('\n📖 See README.md for detailed setup instructions\n');

      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }

      throw new Error('Environment validation failed');
    }

    throw error;
  }
}

/**
 * Check if all production-required environment variables are set
 *
 * @param env - Environment variables object
 * @returns Boolean indicating if production requirements are met
 */
export function isProductionReady(env: NodeJS.ProcessEnv = process.env): boolean {
  const productionRequired = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'POLAR_ACCESS_TOKEN',
    'POLAR_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'RESEND_SENDER_EMAIL',
    'ENCRYPTION_KEY',
  ];

  const missing = productionRequired.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.warn('⚠️  Missing production environment variables:', missing.join(', '));
    return false;
  }

  return true;
}

/**
 * Get a type-safe environment variable
 *
 * @param key - Environment variable key
 * @param env - Validated environment object
 * @returns Environment variable value
 *
 * @example
 * ```typescript
 * const env = validateEnv();
 * const dbUrl = getEnvVar('DATABASE_URL', env);
 * ```
 */
export function getEnvVar<K extends keyof Env>(key: K, env: Env): Env[K] {
  return env[key];
}
