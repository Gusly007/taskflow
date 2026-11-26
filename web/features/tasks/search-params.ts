// The /tasks query string -> typed values for the page and for listTasks() (README rule 6: the URL is the state).
// The URL is user input: an unexpected value falls back to the default view instead of failing.
import { safePath } from '@/lib/paths';
import type { ListTasksQuery, TaskScope } from './task.types';

// What Next gives a page in `searchParams`: ?a=1&a=2 becomes ['1', '2'].
export type RawSearchParams = Record<string, string | string[] | undefined>;

// What the task forms just did, set by their actions on the way back to the list:
// ?created=12, ?updated=12 or ?deleted=12 -> "Task created." / "Task updated." / "Task deleted."
export const TASK_NOTICE_KINDS = ['created', 'updated', 'deleted'] as const;
export type TaskNoticeKind = (typeof TASK_NOTICE_KINDS)[number];

export interface TaskSearchParams {
  scope: TaskScope; // ?scope=mine -> only the tasks I own; anything else -> 'all'
  overdue: boolean; // ?overdue=true -> due date in the past and not done
  notice: { kind: TaskNoticeKind; taskId: number } | null;
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

const positiveInt = (value: string | undefined): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const parseNotice = (params: RawSearchParams): TaskSearchParams['notice'] => {
  for (const kind of TASK_NOTICE_KINDS) {
    const taskId = positiveInt(first(params[kind]));
    if (taskId !== null) return { kind, taskId };
  }
  return null;
};

export function parseTaskSearchParams(params: RawSearchParams): TaskSearchParams {
  return {
    scope: first(params.scope) === 'mine' ? 'mine' : 'all',
    overdue: first(params.overdue) === 'true',
    notice: parseNotice(params),
  };
}

// The API query for these params. overdue is only sent when true: for the API, ?overdue=false
// means "only the tasks that are NOT overdue", not "no filter".
export function toListTasksQuery({ overdue }: TaskSearchParams): ListTasksQuery {
  return overdue ? { overdue: true } : {};
}

// The URL of a view: /tasks, /tasks?scope=mine, /tasks?scope=mine&overdue=true...
export function tasksHref({ scope, overdue }: Pick<TaskSearchParams, 'scope' | 'overdue'>): string {
  const query = new URLSearchParams();
  if (scope === 'mine') query.set('scope', 'mine');
  if (overdue) query.set('overdue', 'true');
  const search = query.toString();
  return search ? `/tasks?${search}` : '/tasks';
}

// The "New task" link and each task's link remember the view they were clicked from,
// to come back to it after saving, deleting or cancelling.
export function newTaskHref(view: string): string {
  return `/tasks/new?${new URLSearchParams({ next: view })}`;
}

export function taskHref(taskId: number, view: string): string {
  return `/tasks/${taskId}?${new URLSearchParams({ next: view })}`;
}

// ?next= of /tasks/new and /tasks/:id: a same-site path only (it ends up in a redirect), /tasks otherwise.
export function parseNextParam(params: RawSearchParams): string {
  return safePath(first(params.next), '/tasks');
}

// The :id of /tasks/:id (null for "abc", "0", "-3"... -> 404).
export function parseTaskIdParam(id: string): number | null {
  return positiveInt(id);
}
