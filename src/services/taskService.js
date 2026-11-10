const taskRepository = require('../repositories/taskRepository');
const { assertTaskAccess } = require('../policies/taskPolicy');

// Only these fields can come from the client. Everything else (id, userId, createdAt...)
// is ignored, otherwise an editor could send { userId: <own id> } and steal the task.
const WRITABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

const pickWritable = (data = {}) =>
  Object.fromEntries(Object.entries(data).filter(([key]) => WRITABLE_FIELDS.includes(key)));

exports.WRITABLE_FIELDS = WRITABLE_FIELDS;

exports.create = async (userId, data) => {
  return taskRepository.create({ ...pickWritable(data), userId });
};

exports.getAllByUser = async (userId) => {
  return taskRepository.findAllIncludingCollaborated(userId);
};

exports.getMyTasks = async (userId) => {
  return taskRepository.findAllByUser(userId);
};

exports.getById = async (taskId, userId) => {
  const { task } = await assertTaskAccess(taskId, userId, 'viewer');
  return task;
};

exports.update = async (taskId, userId, data) => {
  const { task } = await assertTaskAccess(taskId, userId, 'editor', 'Viewers cannot edit tasks');
  return taskRepository.update(task.id, pickWritable(data));
};

exports.remove = async (taskId, userId) => {
  const { task } = await assertTaskAccess(taskId, userId, 'owner', 'Only the task owner can delete tasks');
  return taskRepository.remove(task.id);
};
