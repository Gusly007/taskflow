import { cn } from '@/lib/cn';
import type { TaskStatus } from '../task.types';

// Written out in full: Tailwind only generates the classes it finds in the code,
// so `text-status-${status}` would not work. The colors are tokens in app/globals.css.
const COLORS: Record<TaskStatus, string> = {
  backlog: 'text-status-backlog',
  todo: 'text-status-todo',
  'in-progress': 'text-status-in-progress',
  'in-review': 'text-status-in-review',
  done: 'text-status-done',
};

// Each status has its own shape, not just its own color, so it still reads without color:
// backlog = dashed ring, to do = empty ring, in progress = half full, in review = 3/4 full, done = check.
// Decorative (aria-hidden): the status name is always written next to it.
export function TaskStatusIcon({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', COLORS[status], className)}
    >
      {status === 'done' ? (
        <>
          <circle cx="8" cy="8" r="6.75" fill="currentColor" />
          <path
            d="M5.2 8.3l1.9 1.9 3.7-4"
            className="stroke-background"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={status === 'backlog' ? '2.2 2' : undefined}
          />
          {status === 'in-progress' && <path d="M8 4.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />}
          {status === 'in-review' && <path d="M8 4.5a3.5 3.5 0 1 1-3.5 3.5H8z" fill="currentColor" />}
        </>
      )}
    </svg>
  );
}
