const { body, query } = require('express-validator');

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const statusRule = () =>
  body('status').optional().isIn(STATUSES).withMessage('Status must be todo, in-progress, or done');

const priorityRule = () =>
  body('priority').optional().isIn(PRIORITIES).withMessage('Priority must be low, medium, or high');

// dueDate is a calendar day "YYYY-MM-DD". Sending null removes the due date.
const dueDateRule = () =>
  body('dueDate')
    .optional({ values: 'null' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('dueDate must be a valid date in YYYY-MM-DD format');

exports.validateCreateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  statusRule(),
  priorityRule(),
  dueDateRule(),
];

exports.validateUpdateTask = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  statusRule(),
  priorityRule(),
  dueDateRule(),
];

// ---------- GET /api/tasks and /api/tasks/mine (query string) ----------

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'status'];
const SORT_VALUES = [...SORTABLE_FIELDS, ...SORTABLE_FIELDS.map((field) => `-${field}`)];

// ?status=todo,in-progress -> ['todo', 'in-progress']
const csvQuery = (field, allowed) =>
  query(field)
    .optional()
    .isString()
    .withMessage(`${field} must be a comma-separated list`)
    .bail()
    .customSanitizer((value) => value.split(',').map((v) => v.trim()).filter(Boolean))
    .custom((values) => values.length > 0 && values.every((v) => allowed.includes(v)))
    .withMessage(`${field} must be one or more of: ${allowed.join(', ')}`);

const dateQuery = (field) =>
  query(field)
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage(`${field} must be a valid date in YYYY-MM-DD format`);

exports.validateListTasks = [
  csvQuery('status', STATUSES),
  csvQuery('priority', PRIORITIES),
  query('overdue').optional().isBoolean().withMessage('overdue must be true or false').toBoolean(),
  dateQuery('dueAfter'),
  dateQuery('dueBefore'),
  query('sort')
    .optional()
    .isIn(SORT_VALUES)
    .withMessage(`sort must be one of: ${SORTABLE_FIELDS.join(', ')} (prefix with - for descending)`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100').toInt(),
];

exports.STATUSES = STATUSES;
exports.PRIORITIES = PRIORITIES;
exports.SORTABLE_FIELDS = SORTABLE_FIELDS;
