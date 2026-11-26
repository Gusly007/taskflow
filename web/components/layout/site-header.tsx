import Link from 'next/link';
import { Logo } from './logo';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';

// Header of the public pages (home, sign in, sign up). Logged-in pages use the sidebar instead.
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <ThemeSwitcher />
          <Link href="/login" className="rounded-md px-3 py-1.5 hover:bg-muted">
            Sign in
          </Link>
          <Link href="/register" className="rounded-md bg-accent px-3 py-1.5 font-medium text-accent-foreground hover:opacity-90">
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
