// Form schemas. They mirror the API's validators (authValidator.ts) so the user gets
// errors before a round trip; the API still validates everything on its side.
import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.email({ error: 'Enter a valid email.' }).trim(),
  password: z.string().min(1, { error: 'Enter your password.' }),
});

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, { error: 'Enter your name.' }),
  email: z.email({ error: 'Enter a valid email.' }).trim(),
  password: z.string().min(6, { error: 'At least 6 characters.' }),
});

// The validated data, typed from the schemas: one source of truth.
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
