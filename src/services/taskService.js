const taskRepository = require('../repositories/taskRepository');
const { assertTaskAccess } = require('../policies/taskPolicy');

// Only these fields can come from the client. Everything else (id, userId, createdAt...)
// is ignored, otherwise an editor could send { userId: <own id> } and steal the task.
const WRITABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

const pickWritable = (data = {}) =>
  Object.fromEntries(Object.entries(data).filter(([key]) => WRITABLE_FIELDS.includes(key)));

exports.WRITABLE_FIELDS = WRITABLE_FIELDS;

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = '-createdAt';

// Today's date as YYYY-MM-DD (UTC), used by the "overdue" filter.
const todayUTC = () => new Date().toISOString().slice(0, 10);

// Turns validated query params into repository options.
const buildListOptions = (query = {}, today = todayUTC()) => {
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
      today,
    },
    sort: { field: sort.replace(/^-/, ''), direction: sort.startsWith('-') ? 'DESC' : 'ASC' },
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

const toPage = ({ rows, count }, { page, limit }) => ({
  items: rows,
  meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
});

exports.buildListOptions = buildListOptions;

exports.create = async (userId, data) => {
  return taskRepository.create({ ...pickWritable(data), userId });
};

exports.getAllByUser = async (userId, query) => {
  const options = buildListOptions(query);
  return toPage(await taskRepository.findAllIncludingCollaborated(userId, options), options);
};

exports.getMyTasks = async (userId, query) => {
  const options = buildListOptions(query);
  return toPage(await taskRepository.findAllByUser(userId, options), options);
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
