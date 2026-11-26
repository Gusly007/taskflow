// What the UI shows for each status and priority. Shared by the status menu, the task form and,
// later, the board columns. The display order is the order of TASK_STATUSES / TASK_PRIORITIES.
import type { TaskPriority, TaskStatus } from './task.types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  'in-progress': 'In progress',
  'in-review': 'In review',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
