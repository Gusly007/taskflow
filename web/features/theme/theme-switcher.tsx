import { cookies } from 'next/headers';
import { setTheme } from './theme.actions';
import { THEME_COOKIE, isTheme, type Theme } from './theme';
import { cn } from '@/lib/cn';

const ICONS: Record<Theme, React.ReactNode> = {
  system: <path d="M3 5h18v11H3zM8 20h8M12 16v4" />,
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
};

const LABELS: Record<Theme, string> = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

// A plain form: works without any client JavaScript. Each button submits its own value.
export async function ThemeSwitcher() {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  const current: Theme = isTheme(value) ? value : 'system';

  return (
    <form action={setTheme} className="flex w-fit gap-0.5 rounded-lg border border-border p-0.5">
      {(Object.keys(ICONS) as Theme[]).map((theme) => (
        <button
          key={theme}
          type="submit"
          name="theme"
          value={theme}
          aria-label={LABELS[theme]}
          aria-pressed={theme === current}
          title={LABELS[theme]}
          className={cn(
            'flex size-7 items-center justify-center rounded-md',
            theme === current ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[theme]}
          </svg>
        </button>
      ))}
    </form>
  );
}
