const { Task, TaskCollaborator } = require('../models');
const { Op } = require('sequelize');

exports.create = async (data) => {
  const task = await Task.create(data);
  // Reload so the response always contains every column (dueDate: null...), on SQLite as on PostgreSQL.
  return task.reload();
};

exports.findAllByUser = async (userId) => {
  return Task.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });
};

exports.findAllIncludingCollaborated = async (userId) => {
  const collaborations = await TaskCollaborator.findAll({
    where: { userId },
    attributes: ['taskId'],
  });
  const collaboratedIds = collaborations.map((c) => c.taskId);

  return Task.findAll({
    where: {
      [Op.or]: [
        { userId },
        ...(collaboratedIds.length ? [{ id: collaboratedIds }] : []),
      ],
    },
    order: [['createdAt', 'DESC']],
  });
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
