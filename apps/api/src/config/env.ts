import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().transform((value) => value.split(',').map((origin) => origin.trim())),
  ADMIN_ORIGINS: z
    .string()
    .default('http://localhost:3001')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
  GOOGLE_CLIENT_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  RAZORPAY_KEY_ID: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  RAZORPAY_KEY_SECRET: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export const env = envSchema.parse(process.env);
export const IS_PROD = env.NODE_ENV === 'production';
