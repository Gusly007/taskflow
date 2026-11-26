// The /tasks query string -> typed values for the page and for listTasks() (README rule 6: the URL is the state).
// The URL is user input: an unexpected value falls back to the default view instead of failing.
import { safePath } from '@/lib/paths';
import type { ListTasksQuery, TaskScope } from './task.types';

// What Next gives a page in `searchParams`: ?a=1&a=2 becomes ['1', '2'].
export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface TaskSearchParams {
  scope: TaskScope; // ?scope=mine -> only the tasks I own; anything else -> 'all'
  overdue: boolean; // ?overdue=true -> due date in the past and not done
  created: number | null; // ?created=12 -> the task just created by the form ("Task created")
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

export function parseTaskSearchParams(params: RawSearchParams): TaskSearchParams {
  const created = Number(first(params.created));
  return {
    scope: first(params.scope) === 'mine' ? 'mine' : 'all',
    overdue: first(params.overdue) === 'true',
    created: Number.isInteger(created) && created > 0 ? created : null,
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

// The "New task" link remembers the view it was clicked from, to come back to it after saving.
export function newTaskHref(params: TaskSearchParams): string {
  return `/tasks/new?${new URLSearchParams({ next: tasksHref(params) })}`;
}

// ?next= of /tasks/new: a same-site path only (it ends up in a redirect), /tasks otherwise.
export function parseNextParam(params: RawSearchParams): string {
  return safePath(first(params.next), '/tasks');
}
