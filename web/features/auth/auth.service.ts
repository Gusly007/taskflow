// Every call to the /auth endpoints. Public routes: no token (auth: false).
import 'server-only';
import { apiFetch } from '@/lib/api-client';
import type { AuthResult } from './auth.types';
import type { LoginInput, RegisterInput } from './auth.schemas';

export async function login(input: LoginInput): Promise<AuthResult> {
  const { data } = await apiFetch<AuthResult>('/auth/login', { method: 'POST', body: input, auth: false });
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { data } = await apiFetch<AuthResult>('/auth/register', { method: 'POST', body: input, auth: false });
  return data;
}
