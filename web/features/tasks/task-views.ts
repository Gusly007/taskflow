// Title and empty-state text of each view of the tasks page (the sidebar's All tasks, Mine, Overdue).
import type { TaskSearchParams } from './search-params';

export interface TaskView {
  title: string;
  emptyMessage: string;
}

export function describeTaskView({ scope, overdue }: TaskSearchParams): TaskView {
  if (scope === 'mine' && overdue) return { title: 'My overdue tasks', emptyMessage: 'None of your tasks are overdue.' };
  if (scope === 'mine') return { title: 'My tasks', emptyMessage: "You haven't created any tasks yet." };
  if (overdue) return { title: 'Overdue', emptyMessage: 'No overdue tasks.' };
  return { title: 'All tasks', emptyMessage: 'No tasks yet.' };
}
