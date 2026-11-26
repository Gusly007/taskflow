import * as taskRepository from '../repositories/taskRepository';
import * as projectRepository from '../repositories/projectRepository';
import { assertTaskAccess, type Id } from '../policies/taskPolicy';
import { assertProjectAccess } from '../policies/projectPolicy';
import ApiError from '../utils/apiError';
import type { Task } from '../models';
import type { TaskPriority, TaskSortField, TaskStatus } from '../models/Task';
import type { PageMeta } from '../utils/apiResponse';

// Only these fields can come from the client. Everything else (id, userId, createdAt...)
// is ignored, otherwise an editor could send { userId: <own id> } and steal the task.
// projectId is handled on its own (see create and update): it needs extra checks.
export const WRITABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'] as const;

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  // Project to put the task in (null or absent = personal task).
  projectId?: number | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

// Query params once validated and sanitized by validateListTasks (?status=todo,done&page=2).
export interface ListTasksQuery {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdue?: boolean;
  dueAfter?: string;
  dueBefore?: string;
  projectId?: number;
  sort?: TaskSortField | `-${TaskSortField}`;
  page?: number;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export type ListOptions = taskRepository.TaskListOptions & { page: number };

// Drops every key that is not a writable field. The declared type T only has writable
// fields, so the result still matches T (the cast just tells TypeScript so).
const pickWritable = <T extends UpdateTaskInput>(data: T): T =>
  Object.fromEntries(
    Object.entries(data).filter(([key]) => (WRITABLE_FIELDS as readonly string[]).includes(key)),
  ) as T;

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = '-createdAt';

// Today's date as YYYY-MM-DD (UTC), used by the "overdue" filter.
const todayUTC = (): string => new Date().toISOString().slice(0, 10);

// Turns validated query params into repository options.
export const buildListOptions = (query: ListTasksQuery = {}, today: string = todayUTC()): ListOptions => {
  const page = query.page || 1;
  const limit = query.limit || DEFAULT_PAGE_SIZE;
  const sort = query.sort || DEFAULT_SORT;
  return {
    filters: {
      status: query.status,
      priority: query.priority,
      overdue: query.overdue,
      dueAfter: query.dueAfter,
      dueBefore: query.dueBefore,
      projectId: query.projectId,
      today,
    },
    sort: {
      field: sort.replace(/^-/, '') as TaskSortField,
      direction: sort.startsWith('-') ? 'DESC' : 'ASC',
    },
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const toPage = ({ rows, count }: taskRepository.TaskPage, { page, limit }: ListOptions): Page<Task> => ({
  items: rows,
  meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
});

// Putting a task in a project requires the editor role (or owner) in that project.
const assertCanAddToProject = async (projectId: number, userId: number): Promise<void> => {
  await assertProjectAccess(projectId, userId, 'editor', 'Viewers cannot add tasks to this project');
};

export const create = async (userId: number, data: CreateTaskInput): Promise<Task> => {
  const projectId = data.projectId ?? null;
  if (projectId !== null) await assertCanAddToProject(projectId, userId);
  return taskRepository.create({ ...pickWritable(data), userId, projectId });
};

// Owned tasks + tasks shared with the user + tasks of every project the user owns or is a member of.
export const getAllByUser = async (userId: number, query?: ListTasksQuery): Promise<Page<Task>> => {
  const options = buildListOptions(query);
  // Filtering on a project the user is not in: 404, like GET /api/projects/:id.
  if (options.filters.projectId) await assertProjectAccess(options.filters.projectId, userId, 'viewer');
  const projectIds = await projectRepository.findAccessibleIds(userId);
  return toPage(await taskRepository.findAllIncludingCollaborated(userId, options, projectIds), options);
};

export const getMyTasks = async (userId: number, query?: ListTasksQuery): Promise<Page<Task>> => {
  const options = buildListOptions(query);
  return toPage(await taskRepository.findAllByUser(userId, options), options);
};

export const getById = async (taskId: Id, userId: number): Promise<Task> => {
  const { task } = await assertTaskAccess(taskId, userId, 'viewer');
  return task;
};

export const update = async (taskId: Id, userId: number, data: UpdateTaskInput): Promise<Task | null> => {
  const { task, role } = await assertTaskAccess(taskId, userId, 'editor', 'Viewers cannot edit tasks');
  const changes: taskRepository.TaskChanges = pickWritable(data);

  // Moving a task to another project (or out of its project) is reserved to the task owner,
  // otherwise a project editor could take a task out of the project and keep it hidden.
  if (data.projectId !== undefined && data.projectId !== task.projectId) {
    if (role !== 'owner') throw new ApiError(403, 'Only the task owner can move a task to another project');
    if (data.projectId !== null) await assertCanAddToProject(data.projectId, userId);
    changes.projectId = data.projectId;
  }
  return taskRepository.update(task.id, changes);
};

export const remove = async (taskId: Id, userId: number): Promise<Task | null> => {
  const { task } = await assertTaskAccess(taskId, userId, 'owner', 'Only the task owner can delete tasks');
  return taskRepository.remove(task.id);
};
