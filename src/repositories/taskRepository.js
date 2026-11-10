const { Task, TaskCollaborator } = require('../models');
const { Op, literal } = require('sequelize');

// Filters -> Sequelize conditions. Every filter is optional.
const buildFilters = ({ status, priority, overdue, dueAfter, dueBefore, today } = {}) => {
  const conditions = [];
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
const buildOrder = ({ field = 'createdAt', direction = 'DESC' } = {}) => {
  const order = [];
  if (field === 'priority') {
    order.push([literal(`CASE "Task"."priority" WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END`), direction]);
  } else if (field === 'dueDate') {
    order.push([literal('"Task"."dueDate" IS NULL'), 'ASC'], ['dueDate', direction]);
  } else {
    order.push([field, direction]);
  }
  order.push(['id', direction]);
  return order;
};

const findPage = (scope, { filters, sort, limit, offset } = {}) =>
  Task.findAndCountAll({
    where: { [Op.and]: [scope, ...buildFilters(filters)] },
    order: buildOrder(sort),
    limit,
    offset,
  });

exports.create = async (data) => {
  const task = await Task.create(data);
  // Reload so the response always contains every column (dueDate: null...), on SQLite as on PostgreSQL.
  return task.reload();
};

// Returns { rows, count } (count = total matching tasks, ignoring pagination).
exports.findAllByUser = async (userId, options) => {
  return findPage({ userId }, options);
};

exports.findAllIncludingCollaborated = async (userId, options) => {
  const collaborations = await TaskCollaborator.findAll({
    where: { userId },
    attributes: ['taskId'],
  });
  const collaboratedIds = collaborations.map((c) => c.taskId);

  const scope = {
    [Op.or]: [
      { userId },
      ...(collaboratedIds.length ? [{ id: collaboratedIds }] : []),
    ],
  };
  return findPage(scope, options);
};

exports.ownerTask = async (userid, taskid) => {
  const task = await Task.findByPk(taskid);
  return task && task.userId === userid;
};

exports.findById = async (id) => {
  return Task.findByPk(id);
};

exports.update = async (id, data) => {
  const task = await Task.findByPk(id);
  if (!task) return null;
  return task.update(data);
};

exports.remove = async (id) => {
  const task = await Task.findByPk(id);
  if (!task) return null;
  await task.destroy();
  return task;
};
