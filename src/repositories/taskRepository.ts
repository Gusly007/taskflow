import { Op, literal, type CreationAttributes, type Order, type WhereOptions } from 'sequelize';
import { Task, TaskCollaborator } from '../models';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskSortField, type TaskStatus } from '../models/Task';

export type SortDirection = 'ASC' | 'DESC';

// Every filter is optional except `today`, the reference day for "overdue".
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdue?: boolean;
  dueAfter?: string;
  dueBefore?: string;
  projectId?: number;
  today: string;
}

export interface TaskSort {
  field: TaskSortField;
  direction: SortDirection;
}

export interface TaskListOptions {
  filters: TaskFilters;
  sort: TaskSort;
  limit: number;
  offset: number;
}

// count = total matching tasks, ignoring pagination.
export interface TaskPage {
  rows: Task[];
  count: number;
}

type TaskWhere = WhereOptions<Task>;

// Filters -> Sequelize conditions.
const buildFilters = ({ status, priority, overdue, dueAfter, dueBefore, projectId, today }: TaskFilters): TaskWhere[] => {
  const conditions: TaskWhere[] = [];
  if (projectId) conditions.push({ projectId });
  if (status) conditions.push({ status: { [Op.in]: status } });
  if (priority) conditions.push({ priority: { [Op.in]: priority } });
  if (dueAfter) conditions.push({ dueDate: { [Op.gte]: dueAfter } });
  if (dueBefore) conditions.push({ dueDate: { [Op.lte]: dueBefore } });
  // Overdue = due date in the past and not done yet.
  if (overdue === true) {
    conditions.push({ dueDate: { [Op.lt]: today }, status: { [Op.ne]: 'done' } });
  } else if (overdue === false) {
    conditions.push({ [Op.or]: [{ dueDate: null }, { dueDate: { [Op.gte]: today } }, { status: 'done' }] });
  }
  return conditions;
};

// CASE "Task"."status" WHEN 'backlog' THEN 1 WHEN 'todo' THEN 2 ... END: ranks a column by the order
// of its list of values. The values are our own constants, never user input, so building SQL is safe.
const rankBy = (column: 'priority' | 'status', values: readonly string[]) =>
  literal(`CASE "Task"."${column}" ${values.map((value, i) => `WHEN '${value}' THEN ${i + 1}`).join(' ')} END`);

// Same order on SQLite and PostgreSQL: priority by importance and status by workflow step
// (not alphabetically), tasks without a due date always last, id as tie-breaker so pages never overlap.
const buildOrder = ({ field, direction }: TaskSort): Order => {
  if (field === 'priority') return [[rankBy('priority', TASK_PRIORITIES), direction], ['id', direction]];
  if (field === 'status') return [[rankBy('status', TASK_STATUSES), direction], ['id', direction]];
  if (field === 'dueDate') {
    return [[literal('"Task"."dueDate" IS NULL'), 'ASC'], ['dueDate', direction], ['id', direction]];
  }
  return [[field, direction], ['id', direction]];
};

const findPage = (scope: TaskWhere, { filters, sort, limit, offset }: TaskListOptions): Promise<TaskPage> =>
  Task.findAndCountAll({
    where: { [Op.and]: [scope, ...buildFilters(filters)] },
    order: buildOrder(sort),
    limit,
    offset,
  });

export const create = async (data: CreationAttributes<Task>): Promise<Task> => {
  const task = await Task.create(data);
  // Reload so the response always contains every column (dueDate: null...), on SQLite as on PostgreSQL.
  return task.reload();
};

export const findAllByUser = async (userId: number, options: TaskListOptions): Promise<TaskPage> =>
  findPage({ userId }, options);

// Every task the user can see: owned, shared with them as a collaborator, or in one of
// projectIds (the projects they own or are a member of).
export const findAllIncludingCollaborated = async (
  userId: number,
  options: TaskListOptions,
  projectIds: number[] = [],
): Promise<TaskPage> => {
  const collaborations = await TaskCollaborator.findAll({
    where: { userId },
    attributes: ['taskId'],
  });
  const collaboratedIds = collaborations.map((c) => c.taskId);

  const scope: TaskWhere = {
    [Op.or]: [
      { userId },
      ...(collaboratedIds.length ? [{ id: collaboratedIds }] : []),
      ...(projectIds.length ? [{ projectId: projectIds }] : []),
    ],
  };
  return findPage(scope, options);
};

export const findById = async (id: number): Promise<Task | null> => Task.findByPk(id);

export type TaskChanges = Partial<CreationAttributes<Task>>;

export const update = async (id: number, data: TaskChanges): Promise<Task | null> => {
  const task = await Task.findByPk(id);
  if (!task) return null;
  return task.update(data);
};

export const remove = async (id: number): Promise<Task | null> => {
  const task = await Task.findByPk(id);
  if (!task) return null;
  await task.destroy();
  return task;
};
