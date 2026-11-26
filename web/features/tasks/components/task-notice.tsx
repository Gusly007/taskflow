'use client';

// "Task created." / "Task updated." / "Task deleted.", shown once on the list after a task form
// redirects to it with ?created=12, ?updated=12 or ?deleted=12. The param is removed from the URL
// right away with history.replaceState (no reload, no new history entry, Next's router stays in
// sync), so a refresh or a copied link doesn't show it again.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TASK_NOTICE_KINDS, type TaskNoticeKind } from '../search-params';

const MESSAGES: Record<TaskNoticeKind, string> = {
  created: 'Task created.',
  updated: 'Task updated.',
  deleted: 'Task deleted.',
};

interface TaskNoticeProps {
  kind: TaskNoticeKind;
  // false when the task doesn't match the current view (created from "Overdue" with a future due
  // date, marked done from "Overdue"...): say so, otherwise the user would think it was lost.
  visibleInView: boolean;
}

export function TaskNotice({ kind, visibleInView }: TaskNoticeProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    for (const key of TASK_NOTICE_KINDS) url.searchParams.delete(key);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }, []);

  if (!open) return null;

  return (
    <div role="status" className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2 text-sm">
      <p>
        {MESSAGES[kind]}
        {kind !== 'deleted' && !visibleInView && (
          <>
            {' '}It isn&apos;t shown in this view.{' '}
            <Link href="/tasks" className="font-medium underline underline-offset-2">
              See all tasks
            </Link>
          </>
        )}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
