'use client';

// The status pill of a task: click it, pick a status, done. Like Jira's status button.
//
// - Optimistic: the new status shows at once. If the API refuses (403 for a viewer...),
//   useOptimistic falls back to the server's value by itself and the API's message is shown.
// - Keyboard: Enter / Space / arrows open it, arrows / Home / End move, Enter picks, Escape closes.
//   ARIA "menu button" pattern: the screen reader announces a menu with one checked item.
// - The API decides who may change a status (README rule 7): the menu doesn't guess.
import { useEffect, useId, useOptimistic, useRef, useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { updateTaskStatus } from '../task.actions';
import { STATUS_LABELS } from '../task-labels';
import { TASK_STATUSES, type TaskStatus } from '../task.types';
import { TaskStatusIcon } from './task-status-icon';

interface TaskStatusMenuProps {
  taskId: number;
  status: TaskStatus; // the server's value
}

export function TaskStatusMenu({ taskId, status }: TaskStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Equal to `status`, except while an update runs: then it is the status just picked.
  const [shownStatus, setShownStatus] = useOptimistic(status);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // A click anywhere outside closes the menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const openMenu = () => {
    setError(null);
    setOpen(true);
  };

  const closeMenu = ({ focusTrigger }: { focusTrigger: boolean }) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (next: TaskStatus) => {
    closeMenu({ focusTrigger: true });
    if (next === shownStatus) return;
    startTransition(async () => {
      setShownStatus(next);
      const result = await updateTaskStatus(taskId, next);
      if (result) setError(result.message);
    });
  };

  // Roving focus inside the open menu. The items have tabIndex -1, so Tab leaves the menu (and closes it).
  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu({ focusTrigger: true });
        break;
      case 'Tab':
        closeMenu({ focusTrigger: false });
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative flex shrink-0 flex-col items-end gap-1">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu({ focusTrigger: false }) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs font-medium',
          'hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          isPending && 'opacity-70',
        )}
      >
        <TaskStatusIcon status={shownStatus} />
        <span className="sr-only">Status: </span>
        {STATUS_LABELS[shownStatus]}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-muted-foreground">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Change status"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-1 flex w-44 flex-col rounded-lg border border-border bg-background p-1 shadow-lg"
        >
          {TASK_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={value === shownStatus}
              tabIndex={-1}
              // The menu opens with the focus on the current status.
              autoFocus={value === shownStatus}
              onClick={() => choose(value)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
            >
              <TaskStatusIcon status={value} />
              <span className="flex-1">{STATUS_LABELS[value]}</span>
              {value === shownStatus && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-muted-foreground">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
