// Task shapes returned by the API (see the backend's models/Task.ts).
// Written by hand for now: the Swagger spec has no response schemas yet, so it can't generate them.

export const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // "YYYY-MM-DD"
  userId: number;
  createdAt: string; // ISO date: JSON has no Date type
  updatedAt: string;
}

// "all": tasks I own or collaborate on (GET /tasks). "mine": only the ones I own (GET /tasks/mine).
export type TaskScope = 'all' | 'mine';

// Query string of GET /tasks and /tasks/mine (see the backend's validateListTasks).
export interface ListTasksQuery {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdue?: boolean;
  dueAfter?: string; // "YYYY-MM-DD"
  dueBefore?: string;
  sort?: TaskSortField | `-${TaskSortField}`; // "-" = descending
  page?: number;
  limit?: number; // 1 to 100
}
