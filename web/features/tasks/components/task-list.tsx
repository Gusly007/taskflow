import Link from 'next/link';
import { cn } from '@/lib/cn';
import { taskHref } from '../search-params';
import { formatDueDate } from '../task-dates';
import type { Task } from '../task.types';
import { TaskPriorityIcon } from './task-priority-icon';
import { TaskStatusMenu } from './task-status-menu';

interface TaskListProps {
  tasks: Task[];
  // Project id -> name, to label the tasks that belong to a project.
  projectNames: Map<number, string>;
  // The current view (/tasks?scope=mine...): a task's detail comes back to it when closed.
  view: string;
  // Shown when there is no task, so each view can say why ("No overdue tasks.").
  emptyMessage?: string;
}

export function TaskList({ tasks, projectNames, view, emptyMessage = 'No tasks yet.' }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {tasks.map((task) => {
        const projectName = task.projectId === null ? undefined : projectNames.get(task.projectId);
        return (
          <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              {/* Opens the task's detail in a modal over this list (app/(app)/@modal). */}
              <Link
                href={taskHref(task.id, view)}
                className="truncate rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {task.title}
              </Link>
              {projectName && (
                <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                  {projectName}
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-3">
              {task.dueDate && (
                // isOverdue comes from the API: same rule and same "today" as the Overdue view.
                <span className={cn('flex items-center gap-1 text-xs', task.isOverdue ? 'font-medium text-danger' : 'text-muted-foreground')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
                  <span className="sr-only">{task.isOverdue ? 'Overdue, was due' : 'Due'} </span>
                  <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
                </span>
              )}
              <TaskPriorityIcon priority={task.priority} />
              <TaskStatusMenu taskId={task.id} status={task.status} readOnly={task.role === 'viewer'} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
