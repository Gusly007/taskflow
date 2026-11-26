// What the UI shows for each status. Shared by the status menu and, later, the board columns.
// The display order is TASK_STATUSES (task.types.ts), the workflow order.
import type { TaskStatus } from './task.types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  'in-progress': 'In progress',
  'in-review': 'In review',
  done: 'Done',
};
