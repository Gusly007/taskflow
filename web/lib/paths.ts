// Helpers for the "where to go next" paths carried in forms (?next=/tasks?scope=mine).

// Only same-site paths ("/tasks?scope=mine"), never "//evil.com", "/\evil.com" (browsers read
// both as another site) or "https://...": an open redirect would let a crafted link send users
// to a phishing page right after they log in or save a form.
export const safePath = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.startsWith('/') && value[1] !== '/' && value[1] !== '\\' ? value : fallback;

// withSearchParam('/tasks?scope=mine', 'created', '12') -> '/tasks?scope=mine&created=12'
export const withSearchParam = (path: string, key: string, value: string): string => {
  const url = new URL(path, 'http://localhost'); // the base is only there to parse a relative path
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
};
