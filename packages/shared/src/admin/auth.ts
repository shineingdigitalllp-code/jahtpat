import { z } from 'zod';

export const ADMIN_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/;

export const adminLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const adminRegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z
      .string()
      .regex(
        ADMIN_PASSWORD_REGEX,
        'Password must be at least 10 characters and contain at least one letter and one number',
      ),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== '') {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    },
  );

export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .regex(
        ADMIN_PASSWORD_REGEX,
        'New password must be at least 10 characters and contain at least one letter and one number',
      ),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== '') {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    },
  );

export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
