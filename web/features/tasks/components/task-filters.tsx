'use client';

// The filter bar above the task list. It doesn't load, filter or sort tasks itself: it turns the
// choices into a URL (/tasks?status=todo&priority=high&sort=dueDate) and navigates to it. The page
// then asks the API, through the services, for that filtered, sorted page (README rules 1 and 6).
// Filtering in the browser would only filter the 20 tasks of the current page.
//
// - Four drop-down lists: Status and Priority (several choices), Project and Sort (one).
// - Applied at once on each change, back to page 1, keeping the sidebar view (?scope=, ?overdue=).
//   Each change is a history entry: Back undoes the last filter.
// - Without JavaScript it's a plain GET form with an Apply button.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { PRIORITY_LABELS, STATUS_LABELS } from '../task-labels';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from '../task.types';
import { TASK_SORTS, hasActiveFilters, tasksHref, type TaskSearchParams, type TaskSort } from '../search-params';
import { TaskPriorityIcon } from './task-priority-icon';
import { TaskStatusIcon } from './task-status-icon';

interface TaskFiltersProps {
  params: TaskSearchParams; // the current URL, parsed by the page
  projects: Array<{ id: number; name: string }>; // all my projects, for the Project filter
}

type FilterValues = Pick<TaskSearchParams, 'status' | 'priority' | 'projectId' | 'sort'>;

const fromParams = ({ status, priority, projectId, sort }: TaskSearchParams): FilterValues => ({ status, priority, projectId, sort });

const STATUS_OPTIONS = TASK_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
  icon: <TaskStatusIcon status={status} />,
}));
const PRIORITY_OPTIONS = TASK_PRIORITIES.map((priority) => ({
  value: priority,
  label: PRIORITY_LABELS[priority],
  icon: <TaskPriorityIcon priority={priority} labelled={false} />,
}));

export function TaskFilters({ params, projects }: TaskFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The fields are controlled. They follow what the user clicks right away, and are reset from the
  // URL only when the URL changes from elsewhere (Back, Clear filters, a sidebar link). Remounting the
  // form instead would close the open list and lose the keyboard focus on the box just checked.
  const urlKey = tasksHref(params);
  const [values, setValues] = useState(() => fromParams(params));
  const [syncedKey, setSyncedKey] = useState(urlKey);
  if (urlKey !== syncedKey) {
    setSyncedKey(urlKey);
    setValues(fromParams(params));
  }

  const change = (patch: Partial<FilterValues>) => {
    const next = { ...values, ...patch };
    setValues(next);
    // page 1: page 3 of the old filter may not exist with the new one.
    const href = tasksHref({ scope: params.scope, overdue: params.overdue, ...next, page: 1 });
    startTransition(() => router.push(href, { scroll: false }));
  };

  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name));
  const filtering = hasActiveFilters(params);

  return (
    // A container query, not a screen-width breakpoint: the bar goes on one line when *it* is wide
    // enough for four readable lists, whether the sidebar is next to it or above it.
    <div className="@container">
      <form
        method="get"
        action="/tasks"
        aria-label="Filter tasks"
        aria-busy={isPending}
        // Wide: four equal columns, then a fixed 5.5rem track that keeps Clear filters' room even
        // when it isn't there, so the lists never jump sideways. Narrow: 2 x 2.
        className="relative grid grid-cols-2 items-end gap-3 rounded-lg border border-border bg-surface px-4 py-3 @2xl:grid-cols-[repeat(4,minmax(0,1fr))_5.5rem]"
      >
        {/* Keep the sidebar view when the form is submitted without JavaScript. */}
        {params.scope === 'mine' && <input type="hidden" name="scope" value="mine" />}
        {params.overdue && <input type="hidden" name="overdue" value="true" />}

        <MultiSelect
          name="status"
          label="Status"
          allLabel="All statuses"
          options={STATUS_OPTIONS}
          selected={values.status}
          onChange={(status) => change({ status: status as TaskStatus[] })}
        />

        <MultiSelect
          name="priority"
          label="Priority"
          allLabel="All priorities"
          options={PRIORITY_OPTIONS}
          selected={values.priority}
          onChange={(priority) => change({ priority: priority as TaskPriority[] })}
        />

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Project
          <Select
            name="projectId"
            value={values.projectId ?? ''}
            onChange={(event) => change({ projectId: event.target.value ? Number(event.target.value) : null })}
            size="sm"
            className="text-foreground"
          >
            <option value="">All projects</option>
            {sortedProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          Sort by
          <Select
            name="sort"
            value={values.sort}
            onChange={(event) => change({ sort: event.target.value as TaskSort })}
            size="sm"
            className="text-foreground"
          >
            {TASK_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        {filtering && (
          // Wide: in the reserved 5th track. Narrow: out of the grid, in the top-right corner (on the
          // labels' line), so it adds no row and the list doesn't move down when it appears.
          <Link
            href={tasksHref({ scope: params.scope, overdue: params.overdue, sort: params.sort })}
            scroll={false}
            className={cn(
              'flex h-8 items-center justify-self-end whitespace-nowrap text-sm font-medium underline underline-offset-2',
              '@max-2xl:absolute @max-2xl:right-4 @max-2xl:top-3 @max-2xl:h-4 @max-2xl:text-xs',
            )}
          >
            Clear filters
          </Link>
        )}

        {/* Without JavaScript, nothing applies the filters on change: this button does. Never inside
            a wrapper that can be hidden. (With JavaScript, <noscript> renders nothing.) */}
        <noscript>
          <button type="submit" className="h-8 rounded-md border border-border bg-background px-3 text-sm font-medium">
            Apply
          </button>
        </noscript>

        {/* Announced to screen readers while the new list loads. sr-only is position: absolute, so it
            takes no grid cell, and it is never inside a hidden wrapper. */}
        <span role="status" className="sr-only">
          {isPending ? 'Updating…' : ''}
        </span>
      </form>
    </div>
  );
}
