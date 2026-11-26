export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_COOKIE = 'theme';

export const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);
