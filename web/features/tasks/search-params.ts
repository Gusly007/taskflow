// The /tasks query string -> typed values for the page and for listTasks() (README rule 6: the URL is the state).
// The URL is user input: an unexpected value falls back to the default view instead of failing.
import type { ListTasksQuery, TaskScope } from './task.types';

// What Next gives a page in `searchParams`: ?a=1&a=2 becomes ['1', '2'].
export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface TaskSearchParams {
  scope: TaskScope; // ?scope=mine -> only the tasks I own; anything else -> 'all'
  overdue: boolean; // ?overdue=true -> due date in the past and not done
}

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

export function parseTaskSearchParams(params: RawSearchParams): TaskSearchParams {
  return {
    scope: first(params.scope) === 'mine' ? 'mine' : 'all',
    overdue: first(params.overdue) === 'true',
  };
}

// The API query for these params. overdue is only sent when true: for the API, ?overdue=false
// means "only the tasks that are NOT overdue", not "no filter".
export function toListTasksQuery({ overdue }: TaskSearchParams): ListTasksQuery {
  return overdue ? { overdue: true } : {};
}
