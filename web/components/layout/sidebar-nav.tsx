'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

// The views are URLs, so they can be bookmarked and shared.
// app/(app)/tasks/page.tsx reads ?scope= and ?overdue= (features/tasks/search-params.ts).
const VIEWS = [
  { label: 'All tasks', href: '/tasks', scope: null, overdue: false },
  { label: 'Mine', href: '/tasks?scope=mine', scope: 'mine', overdue: false },
  { label: 'Overdue', href: '/tasks?overdue=true', scope: null, overdue: true },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const scope = params.get('scope');
  const overdue = params.get('overdue') === 'true';

  return (
    <nav aria-label="Views" className="flex flex-col gap-0.5 text-sm">
      {VIEWS.map((view) => {
        const active = pathname === '/tasks' && view.scope === scope && view.overdue === overdue;
        return (
          <Link
            key={view.href}
            href={view.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-2',
              active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
