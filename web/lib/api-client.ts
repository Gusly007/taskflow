// HTTP client for the TaskFlow API: adds the token, reads the response envelope, turns errors
// into ApiError. Only *.service.ts files call apiFetch (an ESLint rule enforces it); pages and
// Server Actions go through a service. The browser never calls the API directly.
import 'server-only';
import { redirect } from 'next/navigation';
import { verifySession } from './dal';

// The envelope every API response uses (see the backend's utils/apiResponse.ts).
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiSuccessBody<T> {
  status: 'success';
  statusCode: number;
  message: string;
  data: T;
  date: string;
  meta?: PageMeta;
}

interface ApiErrorBody {
  status: 'error';
  statusCode: number;
  message: string;
  date: string;
}

// What a list endpoint gives a service: the items and the pagination.
export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// An error answer from the API (400 validation, 403 forbidden, 404, 409...).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | string[] | undefined | null;

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  auth?: boolean; // false for /auth/login and /auth/register
}

export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
}

// ?status=todo,done&page=2 (the API takes lists as comma-separated values). Empty values are skipped.
const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const url = new URL(`/api${path}`, API_URL);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return url.toString();
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, query, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const { token } = await verifySession();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store', // user-specific data: never cache it between users
  });

  // 204 No Content (DELETE): there is no body to parse.
  if (res.status === 204) return { data: undefined as T };

  const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null;

  if (!res.ok || !json || json.status !== 'success') {
    // The API refused our token (expired, or JWT_SECRET changed): drop the session.
    // Server Components can't delete cookies, so a Route Handler does it.
    if (res.status === 401 && auth) redirect('/session-expired');
    throw new ApiError(res.status, json?.message ?? `API error ${res.status}`);
  }

  return { data: json.data, meta: json.meta };
}
