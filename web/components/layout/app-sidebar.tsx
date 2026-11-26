import { Suspense } from 'react';
import { Logo } from './logo';
import { SidebarNav } from './sidebar-nav';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';
import { logout } from '@/features/auth/auth.actions';
import type { User } from '@/features/auth/auth.types';

export function AppSidebar({ user }: { user: User }) {
  return (
    // On a phone the sidebar wraps above the content (see the flex-wrap in app/(app)/layout.tsx).
    <aside className="flex flex-[1_1_200px] flex-col gap-6 border-border bg-surface px-3.5 py-5 md:max-w-60 md:border-r">
      <div className="px-2">
        <Logo href="/tasks" />
      </div>
      {/* SidebarNav reads the URL (useSearchParams), which needs a Suspense boundary. */}
      <Suspense>
        <SidebarNav />
      </Suspense>
      <div className="mt-auto px-2">
        <ThemeSwitcher />
      </div>
      <div className="flex items-center gap-2.5 px-2 text-sm text-muted-foreground">
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 truncate">{user.name}</span>
        <form action={logout}>
          <button type="submit" className="h-8 rounded-md border border-border px-2.5 text-[13px] hover:bg-muted">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
