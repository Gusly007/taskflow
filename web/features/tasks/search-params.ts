// The /tasks query string -> typed values for the page and for listTasks() (README rule 6: the URL is the state).
// The URL is user input: an unexpected value is dropped (or falls back to the default) instead of failing.
import { safePath } from '@/lib/paths';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type ListTasksQuery,
  type TaskPriority,
  type TaskScope,
  type TaskSortField,
  type TaskStatus,
} from './task.types';

// What Next gives a page in `searchParams`: ?a=1&a=2 becomes ['1', '2'].
export type RawSearchParams = Record<string, string | string[] | undefined>;

// What the task forms just did, set by their actions on the way back to the list:
// ?created=12, ?updated=12 or ?deleted=12 -> "Task created." / "Task updated." / "Task deleted."
export const TASK_NOTICE_KINDS = ['created', 'updated', 'deleted'] as const;
export type TaskNoticeKind = (typeof TASK_NOTICE_KINDS)[number];

// The sort choices offered by the filter bar ("-" = descending), with their labels.
export const TASK_SORTS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: '-updatedAt', label: 'Recently updated' },
  { value: 'dueDate', label: 'Due date' }, // soonest first, no due date last
  { value: '-priority', label: 'Priority' }, // high first
  { value: 'status', label: 'Status' }, // workflow order
  { value: 'title', label: 'Title' },
] as const satisfies ReadonlyArray<{ value: TaskSortField | `-${TaskSortField}`; label: string }>;
export type TaskSort = (typeof TASK_SORTS)[number]['value'];
export const DEFAULT_TASK_SORT: TaskSort = '-createdAt'; // the API's default too

export interface TaskSearchParams {
  // The sidebar views
  scope: TaskScope; // ?scope=mine -> only the tasks I own; anything else -> 'all'
  overdue: boolean; // ?overdue=true -> due date in the past and not done
  // The filter bar
  status: TaskStatus[]; // ?status=todo,done (or ?status=todo&status=done, from the form without JavaScript)
  priority: TaskPriority[]; // ?priority=high
  projectId: number | null; // ?projectId=3
  sort: TaskSort; // ?sort=dueDate
  // The pagination
  page: number; // ?page=2, 1 by default
  // After a task form
  notice: { kind: TaskNoticeKind; taskId: number } | null;
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

// ?status=todo,done (what tasksHref writes) and ?status=todo&status=done (a GET form) both give ['todo', 'done']; unknown values are dropped.
const list = <T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T[] => {
  const values = (Array.isArray(value) ? value : value ? [value] : []).flatMap((v) => v.split(','));
  return allowed.filter((option) => values.includes(option)); // also removes duplicates, in a stable order
};

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
  const sort = TASK_SORTS.find((option) => option.value === first(params.sort))?.value ?? DEFAULT_TASK_SORT;
  return {
    scope: first(params.scope) === 'mine' ? 'mine' : 'all',
    overdue: first(params.overdue) === 'true',
    status: list(params.status, TASK_STATUSES),
    priority: list(params.priority, TASK_PRIORITIES),
    projectId: positiveInt(first(params.projectId)),
    sort,
    page: positiveInt(first(params.page)) ?? 1,
    notice: parseNotice(params),
  };
}

// Is any filter of the filter bar active? (The sidebar views and the sort are not filters.)
export const hasActiveFilters = (params: TaskSearchParams): boolean =>
  params.status.length > 0 || params.priority.length > 0 || params.projectId !== null;

// The API query for these params. Only what differs from the API's defaults is sent.
// overdue only when true: for the API, ?overdue=false means "only the tasks that are NOT overdue".
export function toListTasksQuery(params: TaskSearchParams): ListTasksQuery {
  return {
    overdue: params.overdue || undefined,
    status: params.status.length ? params.status : undefined,
    priority: params.priority.length ? params.priority : undefined,
    projectId: params.projectId ?? undefined,
    sort: params.sort === DEFAULT_TASK_SORT ? undefined : params.sort,
    page: params.page > 1 ? params.page : undefined,
  };
}

type HrefParams = Pick<TaskSearchParams, 'scope' | 'overdue'> & Partial<Omit<TaskSearchParams, 'notice'>>;

// The URL of a view, filters and page included: /tasks?scope=mine&status=todo,done&page=2...
// Default values are left out, so the URL stays short (and the same view always has the same URL).
//
// Lists are written comma-separated (?status=todo,done, like the API), not as a repeated param
// (?status=todo&status=done): on a client-side navigation, Next 16 only passes one of the repeated
// values to the page, so the list would show "done" only. (A full page load, e.g. the filter form
// submitted without JavaScript, does pass both: parseTaskSearchParams accepts the two forms.)
export function tasksHref(params: HrefParams): string {
  const query = new URLSearchParams();
  if (params.scope === 'mine') query.set('scope', 'mine');
  if (params.overdue) query.set('overdue', 'true');
  if (params.status?.length) query.set('status', params.status.join(','));
  if (params.priority?.length) query.set('priority', params.priority.join(','));
  if (params.projectId) query.set('projectId', String(params.projectId));
  if (params.sort && params.sort !== DEFAULT_TASK_SORT) query.set('sort', params.sort);
  if (params.page && params.page > 1) query.set('page', String(params.page));
  // Commas are fine in a query string: keep "todo,done" readable instead of "todo%2Cdone".
  const search = query.toString().replaceAll('%2C', ',');
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
