import { z } from 'zod';

export const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => MOBILE_PATTERN.test(value) || z.email().safeParse(value).success, 'Enter a valid mobile number or email'),
  password: z.string().min(1, 'Enter your password').max(72),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  mobile: mobileSchema,
  email: z
    .union([z.literal(''), z.email('Enter a valid email').trim().toLowerCase()])
    .optional()
    .transform((value) => value || undefined),
  password: passwordSchema,
});

export const googleAuthSchema = z.object({ idToken: z.string().min(1) });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export type User = {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
};
