// Title and empty-state text of each view of the tasks page (the sidebar's All tasks, Mine, Overdue).
import { hasActiveFilters, type TaskSearchParams } from './search-params';

export interface TaskView {
  title: string;
  emptyMessage: string;
}

export function describeTaskView(params: TaskSearchParams): TaskView {
  const { scope, overdue } = params;
  const view =
    scope === 'mine' && overdue
      ? { title: 'My overdue tasks', emptyMessage: 'None of your tasks are overdue.' }
      : scope === 'mine'
        ? { title: 'My tasks', emptyMessage: "You haven't created any tasks yet." }
        : overdue
          ? { title: 'Overdue', emptyMessage: 'No overdue tasks.' }
          : { title: 'All tasks', emptyMessage: 'No tasks yet.' };
  // With filters on, "no tasks yet" would be wrong: there are tasks, just none matching.
  return hasActiveFilters(params) ? { ...view, emptyMessage: 'No tasks match these filters.' } : view;
}
