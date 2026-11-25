import { Op, literal, type CreationAttributes, type Order, type WhereOptions } from 'sequelize';
import { Task, TaskCollaborator } from '../models';
import type { TaskPriority, TaskSortField, TaskStatus } from '../models/Task';

export type SortDirection = 'ASC' | 'DESC';

// Every filter is optional except `today`, the reference day for "overdue".
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  overdue?: boolean;
  dueAfter?: string;
  dueBefore?: string;
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
const buildFilters = ({ status, priority, overdue, dueAfter, dueBefore, today }: TaskFilters): TaskWhere[] => {
  const conditions: TaskWhere[] = [];
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

// Same order on SQLite and PostgreSQL: priority by importance (not alphabetically),
// tasks without a due date always last, id as tie-breaker so pages never overlap.
const buildOrder = ({ field, direction }: TaskSort): Order => {
  if (field === 'priority') {
    return [
      [literal(`CASE "Task"."priority" WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END`), direction],
      ['id', direction],
    ];
  }
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

export const findAllIncludingCollaborated = async (userId: number, options: TaskListOptions): Promise<TaskPage> => {
  const collaborations = await TaskCollaborator.findAll({
    where: { userId },
    attributes: ['taskId'],
  });
  const collaboratedIds = collaborations.map((c) => c.taskId);

  const scope: TaskWhere = {
    [Op.or]: [{ userId }, ...(collaboratedIds.length ? [{ id: collaboratedIds }] : [])],
  };
  return findPage(scope, options);
};

export const findById = async (id: number): Promise<Task | null> => Task.findByPk(id);

export const update = async (id: number, data: Partial<CreationAttributes<Task>>): Promise<Task | null> => {
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
