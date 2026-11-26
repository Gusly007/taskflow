// Task shapes returned by the API (see the backend's models/Task.ts).
// Written by hand for now: the Swagger spec has no response schemas yet, so it can't generate them.

// Same values and same order as the backend: the workflow order, also used for sorting.
export const TASK_STATUSES = ['backlog', 'todo', 'in-progress', 'in-review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

// My role on a task, sent by the API with each task (the highest of: creator, collaborator role,
// role through the task's project). owner = everything; editor = edit, but not delete nor move it
// to another project; viewer = read only.
export type TaskRole = 'owner' | 'editor' | 'viewer';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // "YYYY-MM-DD"
  userId: number;
  projectId: number | null; // null = personal task
  createdAt: string; // ISO date: JSON has no Date type
  updatedAt: string;
  // Computed by the API for the logged-in user, so the front doesn't re-implement the rules:
  role: TaskRole;
  isOverdue: boolean; // due before today (UTC) and not done: the same rule as ?overdue=true
}

// The title column is a VARCHAR(255): same limit as the backend's TASK_TITLE_MAX_LENGTH.
export const TASK_TITLE_MAX_LENGTH = 255;

// Body of POST /tasks. Only the title is required; the API applies the defaults
// (status todo, priority medium, no due date, no project = personal task).
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string; // "YYYY-MM-DD"
  projectId?: number; // I must be the owner or an editor of the project (403 / 404 otherwise)
}

// Body of PUT /tasks/:id: only the fields sent are changed. dueDate: null removes the due date;
// projectId: null takes the task out of its project (changing projectId: task owner only).
export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'projectId'>
>;

// "all": tasks I own, collaborate on, or that belong to a project I own or am a member of (GET /tasks).
// "mine": only the ones I own (GET /tasks/mine).
export type TaskScope = 'all' | 'mine';

// Query string of GET /tasks and /tasks/mine (see the backend's validateListTasks).
export interface ListTasksQuery {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdue?: boolean;
  dueAfter?: string; // "YYYY-MM-DD"
  dueBefore?: string;
  projectId?: number; // only the tasks of this project
  sort?: TaskSortField | `-${TaskSortField}`; // "-" = descending
  page?: number;
  limit?: number; // 1 to 100
}
