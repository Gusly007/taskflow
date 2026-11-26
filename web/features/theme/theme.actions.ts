'use server';

import { cookies } from 'next/headers';
import { THEME_COOKIE, isTheme } from './theme';

// Stored in a cookie, not localStorage: the server reads it while rendering <html>,
// so the page arrives in the right theme with no flash of the wrong one.
export async function setTheme(formData: FormData): Promise<void> {
  const theme = formData.get('theme');
  if (!isTheme(theme)) return;
  const cookieStore = await cookies();
  // Setting a cookie in a Server Action makes Next re-render the page with the new value.
  cookieStore.set(THEME_COOKIE, theme, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
}
