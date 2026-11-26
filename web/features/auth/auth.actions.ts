'use server';

// Server Actions = the front's controllers: read the form, validate it, call the service,
// then set the session and redirect. No fetch here: the service talks to the API.
import { redirect } from 'next/navigation';
import * as z from 'zod';
import { ApiError } from '@/lib/api-client';
import { safePath } from '@/lib/paths';
import { createSession, deleteSession } from '@/lib/session-cookie';
import type { FormState } from '@/lib/form-state';
import * as authService from './auth.service';
import { LoginSchema, RegisterSchema } from './auth.schemas';

// Where to go after logging in: a same-site path only (see lib/paths.ts), /tasks otherwise.
const safeNext = (value: FormDataEntryValue | null): string => safePath(value, '/tasks');

export async function login(
  _state: FormState<'email' | 'password'>,
  formData: FormData,
): Promise<FormState<'email' | 'password'>> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get('email') ?? '') };
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  try {
    await createSession(await authService.login(parsed.data));
  } catch (error) {
    if (error instanceof ApiError) return { message: error.message, values };
    throw error; // unexpected (API down...): handled by app/error.tsx
  }
  // redirect() works by throwing, so it must stay outside the try/catch.
  redirect(safeNext(formData.get('next')));
}

export async function register(
  _state: FormState<'name' | 'email' | 'password'>,
  formData: FormData,
): Promise<FormState<'name' | 'email' | 'password'>> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  const values = { name: String(formData.get('name') ?? ''), email: String(formData.get('email') ?? '') };
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  try {
    await createSession(await authService.register(parsed.data));
  } catch (error) {
    if (error instanceof ApiError) return { message: error.message, values };
    throw error;
  }
  redirect('/tasks');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
