import { Suspense } from 'react';
import { Logo } from './logo';
import { MobileNavDrawer } from './mobile-nav-drawer';
import { SidebarNav } from './sidebar-nav';
import { ThemeSwitcher } from '@/features/theme/theme-switcher';
import { logout } from '@/features/auth/auth.actions';
import type { User } from '@/features/auth/auth.types';

const MOBILE_NAV_ID = 'mobile-nav';

// The navigation, as a sidebar on a computer and as a ☰ menu on a phone. Same content in both
// (SidebarContent); only one of the two is ever shown, the other is display: none.
export function AppSidebar({ user }: { user: User }) {
  const content = <SidebarContent user={user} />;

  return (
    <>
      {/* Phone: a compact bar that stays at the top; ☰ opens the menu (works without JavaScript). */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface px-2 md:hidden">
        <button
          type="button"
          popoverTarget={MOBILE_NAV_ID}
          aria-label="Open menu"
          className="flex size-10 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Logo href="/tasks" />
      </header>

      <MobileNavDrawer id={MOBILE_NAV_ID}>
        <div className="flex items-center justify-between px-2">
          <Logo href="/tasks" />
          <button
            type="button"
            popoverTarget={MOBILE_NAV_ID}
            popoverTargetAction="hide"
            aria-label="Close menu"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {content}
      </MobileNavDrawer>

      {/* From md: a column as tall as the screen that stays put (sticky) while the content scrolls,
          so the navigation (top) and the theme switcher and Log out (bottom) are always visible.
          If the screen is too short for all of it, the sidebar scrolls on its own. */}
      <aside className="hidden border-r border-border bg-surface px-3.5 py-5 md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:gap-6 md:overflow-y-auto">
        <div className="px-2">
          <Logo href="/tasks" />
        </div>
        {content}
      </aside>
    </>
  );
}

// The views, then (pushed to the bottom) the theme switcher and the user with Log out.
function SidebarContent({ user }: { user: User }) {
  return (
    <>
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
    </>
  );
}
