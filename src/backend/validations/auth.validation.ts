import { z } from 'zod';

// Matches any of the common special characters
const SPECIAL_CHAR_RE = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(20, 'Password must be at most 20 characters')
  .regex(SPECIAL_CHAR_RE, 'Password must contain at least one special character');

export const authRegisterBody = z.object({
  email: z.string().email('Invalid email address').max(254),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers and underscores')
    .optional(),
  password: passwordSchema,
});

export const authLoginBody = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1),
});

export const authForgotPasswordBody = z.object({
  email: z.string().email('Invalid email address'),
});

export const authResetPasswordBody = z.object({
  token: z.string().length(64, 'Invalid token format'),
  newPassword: passwordSchema,
});
